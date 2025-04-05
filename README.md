# Edible Plant AI

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## How to use Expo Go App When Using WSL2 On Your Project

1. Ensure Your Phone and PC Are on the Same Network
Your mobile phone must be on the same Wi-Fi network as your Windows machine. WSL2 runs in a virtual environment, so network bridging is key.

2. Find Your Windows Host IP (Not WSL IP)
WSL has its own IP and can’t be accessed directly by your mobile. Instead, you need to use your Windows host machine IP.  
	
    In Windows, open PowerShell and run:  
  	`> ipconfig`

3. Configure Expo to Use Your Windows Host IP  
	
    Open your Expo project in WSL2, then create or edit `.expo/settings.json`:  
    ```
    {
      "hostType": "lan"
    }
    ```

4. Use Tunnel Mode (Slower but Reliable)  

	Then, in the WSL terminal, run:  
  `> EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --tunnel`

  	Now you can scan the QR code or type in the address of the app in your Expo Go App:  
  	e.g. `exp://4fposes-anonymous-8081.exp.direct`

  	This uses Expo’s servers as a proxy and works even if LAN networking is problematic.

  	Note: You can disable your firewall temporarily if it won't connect

### Alternative Setup with for WSL + Expo Go Users (Recommended)
Just follow this tutorial: [Expo QR code on Windows Subsystem for Linux (WSL2)](https://dev.to/alecell/expo-qr-code-on-windows-subsystem-for-linux-wsl2-1bjf)

1. This tutorial lets you open your WSL ports so that it can be access to external devices.
2. Your endpoints will use the Windows IP moving forward.  
	E.g.  
    ```
		const response = await axios.post(
          "http://192.XXX.X.X:5000/api/plants/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
      	);
    ```