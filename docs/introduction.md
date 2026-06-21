# **Projet : Copy-of-files**

L'utilitaire `copy-of-files` est une implémentation concrète de script Bash visant à simplifier l'administration système. Il permet de déployer un fichier vers une multitude de machines distantes de manière séquentielle et sécurisée via SCP.

## **Fonctionnalités**

- **Déploiement en masse** : Cible une plage d'IP dynamique.
- **Vérification de connectivité** : Effectue un `ping` avant chaque tentative de transfert pour éviter les timeouts `scp` inutiles.
- **Flexibilité** : Supporte les arguments en ligne de commande avec des valeurs par défaut intelligentes.
- **Feedback visuel** : Affiche clairement l'état d'avancement du déploiement.

![Démonstration du feedback visuel](img/giphy.gif)

## **Mise en route**

### **Pré-requis**

- **SSH/SCP** : Assurez-vous que `openssh-client` est installé localement et que le service SSH tourne sur les machines cibles.
- **Authentification** : Il est fortement recommandé de configurer des clés SSH (`ssh-copy-id`) pour éviter d'avoir à saisir un mot de passe pour chaque machine.
- **Réseau** : Votre machine doit avoir une route active vers la plage d'IP ciblée.

![Illustration de la connectivité réseau](img/scan.png)

### **Configuration**

Le script utilise les variables par défaut suivantes dans `copy.sh` :

| Variable | Valeur par défaut | Description |
| :--- | :--- | :--- |
| `FILENAME` | `./client.c` | Le fichier source à copier. |
| `DEST` | `/home/client/Downloads` | Le chemin de destination sur l'hôte distant. |
| `RANGE` | `133..135` | La plage d'adresses IP (suffixe de l'IP `192.168.211.x`). |

### **Usage**

Vous pouvez lancer le script sans arguments pour utiliser les valeurs par défaut, ou passer des paramètres spécifiques.

**1. Rendre le script exécutable :**

```bash
chmod +x copy.sh
```

**2. Exécution avec les valeurs par défaut :**

```bash
./copy.sh
```