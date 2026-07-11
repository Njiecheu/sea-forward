## 1. A Linux shell

CROCO and its toolchain are built for Linux. You need a Linux command line.

- **Linux** — you already have one. Open a terminal.
- **macOS** — a terminal works, but the from-source NetCDF build in this guide
  is tuned for Linux; the smoothest path is a Linux machine or a Linux VM.
- **Windows** — install **WSL2** (Windows Subsystem for Linux), which gives you
  a real Ubuntu inside Windows.

### Installing WSL2 (Windows only)

Open **PowerShell as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Restart when asked. Launch **Ubuntu** from the Start menu, and create your Linux
username and password when prompted. From now on, every command in these
documents is typed in that Ubuntu terminal.

Check you're in Linux:

```bash
uname -a          # should mention "Linux" and "microsoft-standard-WSL2" on Windows
whoami            # your linux username
```

!!! note
    **RAM note.** Building the libraries and running the model is comfortable with **16 GB** of RAM. With less, use fewer parallel compile jobs (shown later).