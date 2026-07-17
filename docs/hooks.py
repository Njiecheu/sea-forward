import datetime

def on_config(config):
    year = datetime.datetime.now().year
    config.extra['footer'] = f"""
    <div style='text-align:center; padding:10px;'>
      <img src='./img/mooc.png' alt='Sea-Forward Logo' height='40'>
      <p>© {year} Sea-Forward — Documentation générée avec MkDocs</p>
    </div>
    """
    return config
