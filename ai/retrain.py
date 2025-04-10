import torch
from torchvision import models, transforms
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import os, json

# Load model architecture
model = models.resnet50(pretrained=False)
with open("class_map.json") as f:
	CLASS_MAP = json.load(f)
model.fc = torch.nn.Linear(model.fc.in_features, len(CLASS_MAP))
model.load_state_dict(torch.load("model_weights.pt"))
model.eval()

# Load new images & corrected labels from a `corrections/` directory
# Each image has a corresponding JSON file with correct info


# Custom Dataset for new samples
class CorrectionDataset(Dataset):
	def __init__(self, folder):
		self.samples = []
		self.transform = transforms.Compose(
			[transforms.Resize((224, 224)), transforms.ToTensor()]
		)
		for img in os.listdir(folder):
			if img.endswith(".jpg") or img.endswith(".png"):
				json_path = os.path.join(folder, img.replace(".jpg", ".json"))
				with open(json_path) as jf:
					label_data = json.load(jf)
				label = label_data["plant_name"].lower()
				self.samples.append((os.path.join(folder, img), label))

		# Rebuild class map with new labels
		self.class_map = {
			name: i
			for i, name in enumerate(sorted(set(label for _, label in self.samples)))
		}
		with open("class_map.json", "w") as f:
			json.dump(
				{
					v: {"plant_name": k, "scientific_name": "Updated", "edible": True}
					for k, v in self.class_map.items()
				},
				f,
			)

	def __len__(self):
		return len(self.samples)

	def __getitem__(self, idx):
		image_path, label_name = self.samples[idx]
		image = self.transform(Image.open(image_path).convert("RGB"))
		label = self.class_map[label_name]
		return image, label


dataset = CorrectionDataset("corrections/")
loader = DataLoader(dataset, batch_size=4, shuffle=True)

# Finetune the model
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

model.train()
for epoch in range(5):
	for inputs, labels in loader:
		optimizer.zero_grad()
		outputs = model(inputs)
		loss = criterion(outputs, labels)
		loss.backward()
		optimizer.step()

torch.save(model.state_dict(), "model_weights.pt")
print("Model updated with new corrections.")
