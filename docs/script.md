# **Détails du script** `copy.sh`

Ce document explore le fonctionnement interne du script Bash `copy.sh`, en détaillant chaque section et les commandes utilisées.

## **Structure du script**

Le script est conçu pour être simple et efficace, utilisant des fonctionnalités Bash standard pour la gestion des arguments, la vérification de la connectivité et le transfert de fichiers.

### **1. Shebang**

```bash
#!/bin/bash
```

La première ligne, appelée "shebang", indique au système d'exploitation que ce script doit être exécuté avec l'interpréteur `/bin/bash`.

### **2. Gestion des arguments et valeurs par défaut**

```bash
FILENAME=${1:-"./client.c"}
DEST=${2:-"/home/client/Downloads"}
RANGE=${3:-"133..135"}
```

Ces lignes définissent trois variables clés utilisées par le script :

-   `FILENAME` : Le chemin du fichier source à copier.
-   `DEST` : Le répertoire de destination sur les machines distantes.
-   `RANGE` : La plage de suffixes IP à cibler (par exemple, `133..135` pour `192.168.211.133` à `192.168.211.135`).

L'opérateur `${VAR:-default_value}` est une fonctionnalité Bash qui assigne `default_value` à `VAR` si `VAR` est vide ou non défini.

-   `$1`, `$2`, `$3` représentent les premier, deuxième et troisième arguments passés au script lors de son exécution.
-   Si un argument est fourni, il est utilisé. Sinon, la valeur par défaut est appliquée.

### **3. Affichage du bandeau d'en-tête**

```bash
echo "                          --------------------------------------------------"
echo "                          --------------------------------------------------"
echo "                          ---------------COPIE DES FICHIERS-----------------"
echo "                          --------------------------------------------------"
echo "                          --------------------------------------------------"
```

Ces commandes `echo` affichent un bandeau ASCII simple dans le terminal pour indiquer le début de l'opération de copie.

### **4. Boucle de traitement des adresses IP**

```bash
for i in $(eval echo {$RANGE}); do
    ip="192.168.211.$i"
    # ... (suite du code dans la boucle)
done
```

Cette boucle est le cœur du script :

-   `eval echo {$RANGE}` : C'est une astuce Bash pour générer une séquence numérique à partir de la variable `RANGE`. Par exemple, si `RANGE` est `"133..135"`, `eval echo {$RANGE}` se transforme en `echo {133..135}` qui produit `133 134 135`. La commande `for` itère ensuite sur ces nombres.
-   `ip="192.168.211.$i"` : Pour chaque nombre `i` dans la plage, cette ligne construit l'adresse IP complète en préfixant `192.168.211.`.

### **5. Vérification de la connectivité (Ping)**

```bash
    if ping -c 1 -W 1 $ip > /dev/null 2>&1; then
        echo "copie des fichiers à ${ip} ..."
        scp ${FILENAME} client@${ip}:${DEST}
    else
        echo "copie impossible hôte ${ip} indisponible"
    fi
```

-   `ping -c 1 -W 1 $ip` : Tente d'envoyer un seul paquet (`-c 1`) à l'adresse IP `$ip` avec un délai d'attente de 1 seconde (`-W 1`).
-   `> /dev/null 2>&1` : Redirige la sortie standard (`> /dev/null`) et la sortie d'erreur (`2>&1`) vers `/dev/null`, ce qui signifie que le `ping` ne produira aucun affichage dans le terminal. Seul le code de retour de la commande est utilisé.
-   `if ... then ... else ... fi` : Si le `ping` réussit (code de retour 0), le bloc `then` est exécuté. Sinon, le bloc `else` est exécuté.
-   `scp ${FILENAME} client@${ip}:${DEST}` : Si l'hôte est joignable, cette commande `scp` (Secure Copy Protocol) copie le fichier spécifié par `FILENAME` vers la machine distante `$ip`, en utilisant l'utilisateur `client` et le répertoire de destination `DEST`.

### **6. Message de fin**

```bash
echo "done."
```

Une fois la boucle terminée, ce message est affiché pour indiquer que toutes les tentatives de copie ont été effectuées.