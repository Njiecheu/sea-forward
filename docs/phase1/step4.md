Clone the repo into your home folder as `seaforward` (lowercase):

```bash
cd ~
git clone git@github.com:opera-seaforward/seaforward.git
cd seaforward
ls
```

!!! important
    If you don't have SSH set up with GitHub, use the HTTPS URL instead:
    ```bash 
    `git clone https://github.com opera-seaforward/seaforward.git`
    ```
You should see folders like `sftools/`, `install/`, `forecast/`, `hindcast/`,
`code/`, and files `env.sh`, `environment.yml`.

!!! note
    **The golden rule of this project:** everything lives under `~/seaforward`. The scripts assume `SEA_FORWARD_ROOT=${HOME}/seaforward`. If you clone it somewhere else, adjust that variable in `env.sh`.