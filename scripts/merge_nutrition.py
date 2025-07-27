import os
import pandas as pd
from zipfile import ZipFile
import requests

try:
    import duckdb  # type: ignore
except ImportError:  # pragma: no cover
    duckdb = None

try:
    import openfoodfacts
except ImportError:  # pragma: no cover
    openfoodfacts = None

DATA_DIR = "data"


def _assert_file_exists(path: str, download_url: str) -> None:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Missing file {path}. Please download it from {download_url} and place it in {DATA_DIR}"
        )


def load_ciqual() -> pd.DataFrame:
    """Load ANSES Ciqual 2020 Excel table."""
    path = os.path.join(DATA_DIR, "ciqual_2020.xls")
    _assert_file_exists(
        path,
        "https://ciqual.anses.fr/"  # official portal
    )
    return pd.read_excel(path)


def load_fineli(zip_name: str = "fineli_basic_package_1.zip") -> pd.DataFrame:
    """Load Fineli open data CSV package."""
    path = os.path.join(DATA_DIR, zip_name)
    _assert_file_exists(path, "https://fineli.fi")
    with ZipFile(path) as z:
        with z.open("FOOD.csv") as f_food, z.open("COMPONENT_VALUE.csv") as f_comp:
            foods = pd.read_csv(f_food, sep=";")
            comps = pd.read_csv(f_comp, sep=";")
    df = foods.merge(comps, on="FOOD_ID", how="left")
    return df


def load_openfoodfacts_sample(query: str = "", page_size: int = 1000) -> pd.DataFrame:
    """Load a subset of OpenFoodFacts via the API if SDK is available."""
    if openfoodfacts is None:
        raise ImportError("openfoodfacts package is not installed")
    dataset = openfoodfacts.products.ProductDataset()
    records = list(dataset.search(query, page_size=page_size))
    return pd.DataFrame(records)


def load_openfoodfacts_dump() -> pd.DataFrame:
    """Load OpenFoodFacts dump using DuckDB if available."""
    if duckdb is None:
        raise ImportError("duckdb is not installed")
    path = os.path.join(DATA_DIR, "openfoodfacts-products.jsonl.gz")
    _assert_file_exists(path, "https://world.openfoodfacts.org/data")
    con = duckdb.connect(os.path.join(DATA_DIR, "off.db"))
    query = f"""
        SELECT code, product_name, energy-kcal_100g AS energy_kcal,
               proteins_100g, carbohydrates_100g, fat_100g,
               sugars_100g, fiber_100g, salt_100g
        FROM read_ndjson('{path}')
    """
    return con.execute(query).fetchdf()


def fetch_swedish_food(food_id: str) -> pd.DataFrame:
    """Fetch one food entry from the Swedish Food Agency API."""
    url = f"https://api.livsmedelsverket.se/v1/livsmedel/{food_id}"
    headers = {"User-Agent": "NutriTalk"}
    resp = requests.get(url, headers=headers)
    if not resp.ok:
        raise RuntimeError(f"API error {resp.status_code}: {resp.text}")
    data = resp.json()
    return pd.json_normalize(data)


def unify_datasets(*dfs: pd.DataFrame) -> pd.DataFrame:
    """Concatenate multiple nutrition datasets after renaming columns."""
    rename_map = {
        "energy_kcal": "energy_kcal",
        "proteins_100g": "proteins_g",
        "protein_g": "proteins_g",
        "carbohydrates_100g": "carbohydrates_g",
        "carbohydrate_g": "carbohydrates_g",
        "fat_100g": "fat_g",
        "fat_g": "fat_g",
        "sugars_100g": "sugars_g",
        "sugar_g": "sugars_g",
        "fiber_100g": "fibres_g",
        "fiber_g": "fibres_g",
        "salt_100g": "salt_g",
        "salt_g": "salt_g",
    }
    normalized = []
    for df in dfs:
        cols = {c: rename_map[c] for c in df.columns if c in rename_map}
        df2 = df.rename(columns=cols)
        normalized.append(df2)
    return pd.concat(normalized, ignore_index=True, sort=False)


if __name__ == "__main__":
    ciqual_df = load_ciqual()
    print("Ciqual:", ciqual_df.shape)
    fineli_df = load_fineli()
    print("Fineli:", fineli_df.shape)
    try:
        off_df = load_openfoodfacts_dump()
    except Exception as e:
        print("OpenFoodFacts dump not loaded:", e)
        off_df = pd.DataFrame()
    try:
        sweden_df = fetch_swedish_food("1")  # example ID
        print("Sweden sample:", sweden_df.shape)
    except Exception as e:
        print("Swedish API not reachable:", e)
        sweden_df = pd.DataFrame()
    merged = unify_datasets(ciqual_df, fineli_df, off_df, sweden_df)
    print("Unified:", merged.shape)
    out_path = os.path.join(DATA_DIR, "nutrition_unifiee.csv")
    merged.to_csv(out_path, index=False)
    print("Saved", out_path)
