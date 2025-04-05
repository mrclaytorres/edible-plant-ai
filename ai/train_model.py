import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader
import json

# Custom mapping with scientific name and edibility
PLANT_INFO = {
  "tomato": {
    "scientific_name": "Solanum lycopersicum",
    "edible": True
  },
  "basil": {
    "scientific_name": "Ocimum basilicum",
    "edible": True
  },
  "mint": {
    "scientific_name": "Mentha",
    "edible": True
  },
  "bamboo": {
    "scientific_name": "Bambusa vulgaris",
    "edible": False
  },
  "mint": {
    "scientific_name": "Mentha",
    "edible": True
  },
  # Add more plants as needed
}

# Transforms
transform = transforms.Compose([
  transforms.RandomResizedCrop(224),
  transforms.RandomHorizontalFlip(),
  transforms.RandomRotation(30),
  transforms.ColorJitter(brightness=0.3, contrast=0.3),
  transforms.ToTensor()
])

# Dataset & Loader
train_dataset = datasets.ImageFolder("dataset", transform=transform)
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

# Save class map with scientific names and edibility
class_to_idx = train_dataset.class_to_idx
idx_to_class_map = {}

for class_name, class_idx in class_to_idx.items():
  info = PLANT_INFO.get(class_name.lower(), {})
  idx_to_class_map[class_idx] = {
    "plant_name": class_name.capitalize(),
    "scientific_name": info.get("scientific_name", "Unknown"),
    "edible": info.get("edible", False)
  }

with open("class_map.json", "w") as f:
  json.dump(idx_to_class_map, f, indent=2)

# Model
model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, len(train_dataset.classes))

# Training Setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Train Loop
for epoch in range(5):  # adjust as needed
  for inputs, labels in train_loader:
    inputs, labels = inputs.to(device), labels.to(device)

    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, labels)
    loss.backward()
    optimizer.step()

  print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

# Save model
torch.save(model, "model.pt")
