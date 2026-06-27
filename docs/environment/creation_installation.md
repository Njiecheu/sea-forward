# Environment Creation and Installation

## 1. Prerequisite: Install Conda

Before creating the environment, you must have Conda installed on your machine. We recommend installing **Miniconda**, which is a free, minimal installer.

!!!warning
    **Please choose and follow ONLY the instructions below that match your Operating System.**

**On Linux:**

1. Download the installer:
   ```bash
   wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
   ```
2. Run the installer:
   ```bash
   bash miniconda.sh
   ```
3. Follow the prompts on the screen (press Enter, read the license, type `yes` to accept, and `yes` to initialize conda).
4. **Restart your terminal** after installation.

**On macOS:**

1. Download the installer:
   ```bash
   # For Intel Macs:
   curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
   # For Apple Silicon (M1/M2/M3):
   curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
   ```
2. Run the installer:
   ```bash
   bash Miniconda3-latest-MacOSX-*.sh
   ```
3. Follow the prompts and **restart your terminal** after installation.

**On Windows:**

Since you are using WSL (Windows Subsystem for Linux), you are running a Linux environment.

1. Open your **Ubuntu** terminal.
2. Follow the exact same [On Linux](cloning.md#linux) installation instructions above to install Miniconda within WSL.

### 2. Setup the Environment

Analyzing CROCO outputs requires a dedicated Python environment with several specialized scientific libraries. The project already provides a default configuration file (`env.yml`) that contains all the base requirements.

1. **Create the Conda Environment from `env.yml`**:
   The `env.yml` file already contains the predefined environment name (`croco_pyenv`) and the complete list of all necessary packages. You do not need to specify the name manually.
   From the root of the project, navigate to the vendor directory and run this command:

   ```bash
   cd vendor/croco_pytools
   conda env create -f env.yml
   cd -
   ```
2. **Activate the Environment**:
   ```bash
   conda activate croco_pyenv
   ```
