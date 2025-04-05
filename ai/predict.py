import sys
from PIL import Image
import torch
from torchvision import transforms
import json

# Load model (replace with your actual model path)
model = torch.load('model.pt')
model.eval()

# Sample class index to plant name mapping
CLASS_MAPPING = json.load(open('class_map.json'))

def predict(image_path):
  image = Image.open(image_path).convert('RGB')
  transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
  ])
  input_tensor = transform(image).unsqueeze(0)

  with torch.no_grad():
    output = model(input_tensor)
    predicted_class = torch.argmax(output, dim=1).item()

  prediction = CLASS_MAPPING.get(predicted_class, {
    "plant_name": "Unknown",
    "scientific_name": "Unknown",
    "edible": False,
  })

  print(json.dumps(prediction))

if __name__ == "__main__":
  predict(sys.argv[1])
