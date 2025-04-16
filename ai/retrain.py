import torch
from torchvision import models, transforms
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from PIL import Image
import os
import json
import shutil
from collections import Counter

script_dir = os.path.dirname(os.path.abspath(__file__))
corrections_dir = os.path.join(script_dir, "corrections")
replay_dir = os.path.join(script_dir, "replay_buffer")
os.makedirs(corrections_dir, exist_ok=True)
os.makedirs(replay_dir, exist_ok=True)

# === Step 1: Load existing class map ===
class_map_path = os.path.join(script_dir, "class_map.json")
if os.path.exists(class_map_path):
  with open(class_map_path) as f:
    existing_map = json.load(f)
else:
  existing_map = {}

# === Step 2: Custom Dataset with Replay Buffer ===
class CorrectionDataset(Dataset):
  def __init__(self, folders):
    self.samples = []
    self.transform = transforms.Compose([
      transforms.Resize((224, 224)),
      transforms.ToTensor()
    ])
    
    # Reverse map: plant name (lowercased) to class index
    name_to_id = {}
    for k, v in existing_map.items():
      name_to_id[v["plant_name"].lower()] = int(k)

    next_id = max(name_to_id.values(), default=-1) + 1

    for folder in folders:
      for file in os.listdir(folder):
        if file.endswith(".jpg") or file.endswith(".png"):
          image_path = os.path.join(folder, file)
          json_path = os.path.join(folder, file.replace(".jpg", ".json").replace(".png", ".json"))
          if not os.path.exists(json_path):
            continue

          with open(json_path) as jf:
            label_data = json.load(jf)
          plant_name = label_data["plant_name"].lower()

          if plant_name not in name_to_id:
            name_to_id[plant_name] = next_id
            existing_map[str(next_id)] = {
              "plant_name": label_data["plant_name"],
              "scientific_name": label_data.get("scientific_name", ""),
              "edible": label_data.get("edible", True)
            }
            next_id += 1

          label_id = name_to_id[plant_name]
          self.samples.append((image_path, label_id))

    # Save updated class map
    with open(class_map_path, "w") as f:
      json.dump(existing_map, f, indent=2)

  def __len__(self):
    return len(self.samples)

  def __getitem__(self, idx):
    image_path, label = self.samples[idx]
    image = self.transform(Image.open(image_path).convert("RGB"))
    return image, label

# === Step 3: Load model and adjust for new classes ===
dataset = CorrectionDataset([corrections_dir, replay_dir])
if len(dataset) == 0:
  print("No new correction data found.")
  exit()

# Recalculate class count based on updated map
with open(class_map_path) as f:
  updated_class_map = json.load(f)
num_classes = len(updated_class_map)

# === Load model and adjust for new classes ===
model = models.resnet50(pretrained=True)

# Load existing weights if available
weights_path = os.path.join(script_dir, "model_weights.pt")
if os.path.exists(weights_path):
  # Load using previous fc shape
  state_dict = torch.load(weights_path)
  old_num_classes = state_dict['fc.weight'].shape[0]
  model.fc = torch.nn.Linear(model.fc.in_features, old_num_classes)
  model.load_state_dict(state_dict)

# === Selective unfreezing ===
for name, param in model.named_parameters():
  if "layer4" in name or "fc" in name:
    param.requires_grad = True
  else:
    param.requires_grad = False

# === Replace final layer with new size and unfreeze it ===
model.fc = torch.nn.Linear(model.fc.in_features, num_classes)

# Move model to device AFTER modifying fc
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# === Step 4: Balanced Sampling ===
labels = [label for _, label in dataset.samples]
class_counts = Counter(labels)
weights = [1.0 / class_counts[label] for label in labels]
sampler = WeightedRandomSampler(weights, len(weights))
loader = DataLoader(dataset, batch_size=4, sampler=sampler)

# === Step 5: Train ===
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4)

for epoch in range(5):
  running_loss = 0.0
  for inputs, labels in loader:
    inputs, labels = inputs.to(device), labels.to(device)
    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, labels)
    loss.backward()
    optimizer.step()
    running_loss += loss.item()
  print(f"Epoch {epoch+1}: Loss = {running_loss:.4f}")

# === Step 6: Save weights ===
torch.save(model.state_dict(), weights_path)
print("✅ Model updated and saved.")

# === Step 7: Move processed corrections ===
processed_dir = os.path.join(corrections_dir, "processed")
os.makedirs(processed_dir, exist_ok=True)
 
for img_path, _ in dataset.samples:
  
  if corrections_dir not in img_path:
    continue
  
  img_filename = os.path.basename(img_path)
  json_filename = img_filename.replace(".jpg", ".json").replace(".png", ".json")
  img_dest = os.path.join(processed_dir, img_filename)
  json_dest = os.path.join(processed_dir, json_filename)
  
  # Move image file
  if os.path.exists(img_path):
    shutil.move(img_path, img_dest)
    
  # Move JSON label file
  original_json_path = os.path.join(corrections_dir, json_filename)
  if os.path.exists(original_json_path):
    shutil.move(original_json_path, json_dest)

print("✅ Processed correction files moved to 'corrections/processed/'.")