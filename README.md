#  NaviMeet - Smart Meeting Point Finder  

NaviMeet is a **web-based prototype** that takes the hassle out of group meetups. Enter everyone’s locations, and it finds an **optimal meeting point** using **Google Maps APIs**. Whether it’s a transit hub, café, or park, NaviMeet suggests practical spots and shows them on an interactive map.

---

## 🎯 Motive  
Planning a meetup can be a headache—where’s a spot that works for everyone? NaviMeet **automates** this by calculating a balanced meeting point, **saving time and effort** for friends catching up, colleagues meeting between offices, or travelers converging from different spots.

---

## ✨ Key Features  

✅ **Optimal Meeting Points**: Input multiple locations, and get a smart meetup spot tailored to your group.  
✅ **Change Meeting Point Button**: Cycle through alternative suggestions (e.g., different transit stops) with one click.  
✅ **Custom Recommendations**: Choose your vibe—cafés, restaurants, malls, parks, transit hubs, or popular places.  
✅ **Interactive Map**: See locations, routes, and alternatives with colorful markers and paths.  
✅ **Quick Sharing**: Copy or share the meeting point details via messaging apps.   
✅ **Efficient Mode**:  
  - 🚉 **Without a destination**: Finds a central transit hub.  
  - 🏁 **With a destination**: Picks a strategic merge point for group travel.  


---

## 🔥 Efficient Mode Explained  
Efficient Mode is NaviMeet’s standout feature, designed to **optimize travel** for your group. Here’s how it works:

### 🚉 **Without a Destination**  
- **What It Does**: Finds a transit hub (e.g., bus stop, train station) near the midpoint of all locations.  
- **Why It’s Efficient**: Cuts down travel distance and prioritizes public transport.  
- **Example**: Three friends in Bangalore (Koramangala, Indiranagar, MG Road) get a bus stop in Domlur—central and easy to reach.

### 🏁 **With a Destination**  
- **What It Does**: Identifies a merge point (e.g., a transit stop) where routes to the destination overlap, so the group can meet and travel together.  
- **Change Button**: Click "Change Meeting Point" to try other merge points if the first isn’t ideal.  
- **Why It’s Efficient**: Reduces individual trips and leverages transit for cost-effective travel.  
- **Example**: Three colleagues heading to Whitefield meet at a Domlur transit stop, then take one bus together—fewer trips, less hassle.

### 🏆 **Why It’s Useful**  
- Minimizes total travel effort.  
- Focuses on transit hubs for accessibility.  
- Streamlines group trips with the "Change" button for flexibility.

---

## 📋 Prerequisites  
Before you start, ensure you have:  
- **Google Maps API Key** with:  
  - Maps JavaScript API  
  - Places API  
  - Directions API  
- **Git** installed ([Download Git](https://git-scm.com/))  
- **Node.js** for local testing ([Download Node.js](https://nodejs.org/))  
- A modern browser (Chrome, Firefox, Edge)

---

## ⚠️ Important Notes  
- No Free Demo: I ain’t hosting this—you gotta set it up with your own key.  
- Keep Your Key Safe: Don’t let it slip on GitHub or anywhere public.  
-This app uses Google Maps APIs (Maps JavaScript, Places, Directions), which may incur costs based on your API key usage. I, the developer, am not responsible for any charges, errors, or issues arising from API requests.

---

## 📜 License & Disclaimer  
**License**: NaviMeet is not an open-source project. This code is intended for personal use only. Redistribution or commercial use is prohibited without prior written permission from the author.  
**Disclaimer**: This project utilizes Google Maps APIs. Any associated costs, technical issues, or liabilities arising from its use are the responsibility of the user, and the author is not liable for them.  
**© 2025, Vignesh B S - All rights reserved.**

---

### 🛠️ How to Set Up, Host, and Use NaviMeet  
Here’s everything you need to get NaviMeet running and use it, step-by-step:

#### 1️⃣ Grab the Code  
- Open a terminal and download the NaviMeet code.  
- Navigate into the NaviMeet folder.

#### 2️⃣ Open env.js and Clear Any Old Key  
- Open the env.js file located in the src/config folder using a text editor like Notepad or VS Code.  
- Look for an existing Google Maps API key value.  
- Replace it with the placeholder text "YOUR_API_KEY_HERE".  
- Save the file.

#### 3️⃣ Snag Your Own API Key  
- Go to the Google Cloud Console website.  
- Create a new project, such as "NaviMeet".  
- Enable the Maps JavaScript API, Places API, and Directions API in the API services library.  
- Go to the Credentials section, create a new API Key, and copy it.

#### 4️⃣ Swap in Your Actual Key  
- Open the env.js file again.  
- Find the "YOUR_API_KEY_HERE" placeholder.  
- Replace it with your copied API key.  
- Save the file.

#### 5️⃣ Deploy It Locally  
- Install a local server tool called live-server.  
- Start the server to run NaviMeet.  
- Open your browser to see NaviMeet at the local address, or open the index.html file directly (note that some features might need the server).

#### 6️⃣  Use NaviMeet  
- Get NaviMeet running by completing the previous steps.  
- Add your crew’s locations in the "Enter the locations of all participants" section, selecting at least two from the autocomplete suggestions.  
- Optionally, add a destination in the "Destination (Optional)" field or leave it blank.  
- Select "Efficient Mode (Auto-detects Destination)" from the dropdown menu.  
- Click "Find Meeting Point" to see the suggested spot—without a destination, it’s a transit hub near the middle with blue and green pins; with a destination, it’s a merge point with blue, green, and red pins plus routes.  
- If available, click the "Change" button next to "Suggested Meeting Point" to cycle through other options like different transit stops.  
- Click "Share Meeting Point" to copy or share the details, such as the merge point name and coordinates.  
- Adjust by adding or removing locations with the "➕" or "❌" buttons, then repeat the last few steps as needed.
