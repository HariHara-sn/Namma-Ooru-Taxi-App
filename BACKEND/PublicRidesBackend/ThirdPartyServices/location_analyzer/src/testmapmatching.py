
import requests
import json

with open('map_matching_payload.txt', 'r') as file:
    for line in file:
        payload = line.strip()
        payload = json.loads(payload)
        headers = {'Content-Type': 'application/json'}
        try:
            response = requests.post('https://neapi.vmmaps.com/ne/api?op=trace_attributes', headers=headers, json=payload)
            print("Status Code:", response.status_code)
        except requests.exceptions.RequestException as e:
            print(response.status_code, "Response code")
            print("Error:", e)