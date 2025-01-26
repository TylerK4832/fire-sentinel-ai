import requests
import json

# API endpoint URL
url = "https://cameras.alertcalifornia.org/public-camera-data/all_cameras-v3.json"

# Fetch the JSON data
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    
    cameras_list = []

    for camera in data['features']:
        name = camera['properties']['name']
        camera_id = camera['properties']['id']
        last_frame_ts = camera['properties']['last_frame_ts']

        # Filter cameras based on conditions
        if name != "" and last_frame_ts > 1737673111:
            # Construct the link
            link = f"https://cameras.alertcalifornia.org/public-camera-data/{camera_id}/latest-frame.jpg"

            # Add camera data to the list
            cameras_list.append({
                "name": name,
                "id": camera_id,
                "link": link
            })

    # Write all camera data to a single JSON file
    with open("filtered_cameras_full.json", "w", encoding="utf-8") as file:
        json.dump(cameras_list, file, indent=4)

    print("All filtered camera data has been saved to 'filtered_cameras_full.json'.")
else:
    print(f"Failed to fetch data. HTTP Status Code: {response.status_code}")
