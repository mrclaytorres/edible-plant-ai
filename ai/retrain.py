import torch
from torchvision import models, transforms
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
corrections_dir = os.path.join(script_dir, "corrections")

# === Step 1: Load existing class map ===
class_map_path = os.path.join(script_dir, "class_map.json")
if os.path.exists(class_map_path):
  with open(class_map_path) as f:
    existing_map = json.load(f)
else:
  existing_map = {}

# Reverse map: plant name (lowercased) to class index
name_to_id = {v["plant_name"].lower(): int(k) for k, v in existing_map.items()}
next_id = max(name_to_id.values(), default=-1) + 1

# === Step 2: Custom Dataset for new corrections ===
class CorrectionDataset(Dataset):
  def __init__(self, folder):
    self.samples = []
    self.transform = transforms.Compose([
      transforms.Resize((224, 224)),
      transforms.ToTensor()
    ])

    for file in os.listdir(folder):
      if file.endswith(".jpg") or file.endswith(".png"):
        image_path = os.path.join(folder, file)
        json_path = os.path.join(folder, file.replace(".jpg", ".json").replace(".png", ".json"))

        if not os.path.exists(json_path):
          continue

        with open(json_path) as jf:
          label_data = json.load(jf)
        plant_name = label_data["plant_name"].lower()

        # Update mapping if new plant found
        if plant_name not in name_to_id:
          name_to_id[plant_name] = next_id
          existing_map[str(next_id)] = {
            "plant_name": label_data["plant_name"],
            "scientific_name": label_data.get("scientific_name", "Updated"),
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
num_classes = len(existing_map)
model = models.resnet50(pretrained=False)

# Load existing weights if available
weights_path = os.path.join(script_dir, "model_weights.pt")
if os.path.exists(weights_path):
  # Load previous final layer size
  with open(class_map_path) as f:
    old_class_map = json.load(f)
  old_num_classes = len(old_class_map)

  model.fc = torch.nn.Linear(model.fc.in_features, old_num_classes)
  model.load_state_dict(torch.load(weights_path))

# Replace final layer with new size
model.fc = torch.nn.Linear(model.fc.in_features, num_classes)

model.train()

# === Step 4: Train on new data ===
dataset = CorrectionDataset(corrections_dir)
if len(dataset) == 0:
  print("No new correction data found.")
  exit()

loader = DataLoader(dataset, batch_size=4, shuffle=True)

criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

for epoch in range(5):
  running_loss = 0.0
  for inputs, labels in loader:
    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, labels)
    loss.backward()
    optimizer.step()
    running_loss += loss.item()
  print(f"Epoch {epoch+1}: Loss = {running_loss:.4f}")

# === Step 5: Save updated weights ===
torch.save(model.state_dict(), weights_path)
print("✅ Model updated and saved.")
