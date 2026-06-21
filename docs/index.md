# Phase 0 - Préparation de l'environnement 

## Prérequis système
- Système d'exploitation : Linux
- Outils requis :
  - `git`
  - `wget` ou `curl`
  - `bzip2` (pour l'installation de Miniconda)
- Privilèges : Accès sudo pour l'installation des dépendances système

## 1. Clonage du dépôt
### Via SSH :
```bash
git clone git@github.com:opera-seaforward/seaforward-pytools.git
cd seaforward-pytools
```

Via HTTPS :
```bash
git clone https://github.com/opera-seaforward/seaforward-pytools.git
cd seaforward-pytools
```

## 2. Installation de Miniconda
Téléchargement et installation :

```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
bash miniconda.sh -b -p $HOME/miniconda
```

### **Configuration du PATH :**
```bash
echo 'export PATH="$HOME/miniconda/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### **Vérification de l'installation :**
```bash
conda --version
```

## **3. Création de l'environnement virtuel**
À partir du fichier env.yml :
```bash
conda env create -f env.yml
```
### **Activation de l'environnement :**
```bash

conda activate seaforward-env
```

### **Vérification de l'environnement :**

```bash
conda env list
python --version
```