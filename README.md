# URL Shortener API Testing with Postman

## Long to Short
Send a long URL to the `/shorten` endpoint. The server generates a short code and returns a shortened URL.  
<img width="1501" height="998" alt="long to short" src="https://github.com/user-attachments/assets/dd40e221-dd3d-4023-b36a-422c2e4e65b1" />


## Short to Long (Stats)
Use `/stats/:code` to retrieve the original long URL and its details like click count and expiry.  
<img width="1504" height="998" alt="shorturl" src="https://github.com/user-attachments/assets/75cb22a9-cf83-4b13-84f8-14d9599afecd" />

## Redirect to Long
Accessing `/:code` will redirect you to the original long URL if it exists and has not expired.  
<img width="1488" height="960" alt="Long" src="https://github.com/user-attachments/assets/941a7175-7233-4e4d-a762-f631d675fa7c" />

