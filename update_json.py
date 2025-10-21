import os
import json

# Este es el diccionario principal que contiene el mapeo de nombres de países a sus códigos ISO.
# El script lo usará para asignar códigos automáticamente sin necesidad de editarlo.
ISO_COUNTRY_CODES = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "American Samoa": "AS", "Andorra": "AD",
    "Angola": "AO", "Anguilla": "AI", "Antarctica": "AQ", "Antigua and Barbuda": "AG", "Argentina": "AR",
    "Armenia": "AM", "Aruba": "AW", "Australia": "AU", "Austria": "AT", "Azerbaijan": "AZ",
    "Bahamas": "BS", "Bahrain": "BH", "Bangladesh": "BD", "Barbados": "BB", "Belarus": "BY",
    "Belgium": "BE", "Belize": "BZ", "Benin": "BJ", "Bermuda": "BM", "Bhutan": "BT", "Bolivia": "BO",
    "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR", "British Indian Ocean Territory": "IO",
    "Brunei Darussalam": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI", "Cambodia": "KH",
    "Cameroon": "CM", "Canada": "CA", "Cape Verde": "CV", "Cayman Islands": "KY", "Central African Republic": "CF",
    "Chad": "TD", "Chile": "CL", "China": "CN", "Christmas Island": "CX", "Cocos (Keeling) Islands": "CC",
    "Colombia": "CO", "Comoros": "KM", "Congo": "CG", "Congo, The Democratic Republic of the": "CD",
    "Cook Islands": "CK", "Costa Rica": "CR", "Cote D'Ivoire": "CI", "Croatia": "HR", "Cuba": "CU",
    "Cyprus": "CY", "Czech Republic": "CZ", "Denmark": "DK", "Djibouti": "DJ", "Dominica": "DM",
    "Dominican Republic": "DO", "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Equatorial Guinea": "GQ",
    "Eritrea": "ER", "Estonia": "EE", "Ethiopia": "ET", "Falkland Islands (Malvinas)": "FK",
    "Faroe Islands": "FO", "Fiji": "FJ", "Finland": "FI", "France": "FR", "French Guiana": "GF",
    "French Polynesia": "PF", "Gabon": "GA", "Gambia": "GM", "Georgia": "GE", "Germany": "DE",
    "Ghana": "GH", "Gibraltar": "GI", "Greece": "GR", "Greenland": "GL", "Grenada": "GD", "Guadeloupe": "GP",
    "Guam": "GU", "Guatemala": "GT", "Guernsey": "GG", "Guinea": "GN", "Guinea-Bissau": "GW",
    "Guyana": "GY", "Haiti": "HT", "Honduras": "HN", "Hong Kong": "HK", "Hungary": "HU", "Iceland": "IS",
    "India": "IN", "Indonesia": "ID", "Iran, Islamic Republic Of": "IR", "Iraq": "IQ", "Ireland": "IE",
    "Isle of Man": "IM", "Israel": "IL", "Italy": "IT", "Jamaica": "JM", "Japan": "JP", "Jersey": "JE",
    "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE", "Kiribati": "KI", "Korea, Democratic People's Republic of": "KP",
    "Korea, Republic of": "KR", "Kuwait": "KW", "Kyrgyzstan": "KG", "Lao People's Democratic Republic": "LA",
    "Latvia": "LV", "Lebanon": "LB", "Lesotho": "LS", "Liberia": "LR", "Libyan Arab Jamahiriya": "LY",
    "Liechtenstein": "LI", "Lithuania": "LT", "Luxembourg": "LU", "Macao": "MO",
    "Macedonia, The Former Yugoslav Republic of": "MK", "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY",
    "Maldives": "MV", "Mali": "ML", "Malta": "MT", "Marshall Islands": "MH", "Martinique": "MQ",
    "Mauritania": "MR", "Mauritius": "MU", "Mayotte": "YT", "Mexico": "MX", "Micronesia, Federated States of": "FM",
    "Moldova, Republic of": "MD", "Monaco": "MC", "Mongolia": "MN", "Montserrat": "MS",
    "Morocco": "MA", "Mozambique": "MZ", "Myanmar": "MM", "Namibia": "NA", "Nauru": "NR", "Nepal": "NP",
    "Netherlands": "NL", "Netherlands Antilles": "AN", "New Caledonia": "NC", "New Zealand": "NZ",
    "Nicaragua": "NI", "Niger": "NE", "Nigeria": "NG", "Niue": "NU", "Norfolk Island": "NF",
    "Northern Mariana Islands": "MP", "Norway": "NO", "Oman": "OM", "Pakistan": "PK", "Palau": "PW",
    "Palestinian Territory, Occupied": "PS", "Panama": "PA", "Papua New Guinea": "PG", "Paraguay": "PY",
    "Peru": "PE", "Philippines": "PH", "Pitcairn": "PN", "Poland": "PL", "Portugal": "PT", "Puerto Rico": "PR",
    "Qatar": "QA", "Reunion": "RE", "Romania": "RO", "Russian Federation": "RU", "Rwanda": "RW",
    "Saint Helena": "SH", "Saint Kitts and Nevis": "KN", "Saint Lucia": "LC", "Saint Pierre and Miquelon": "PM",
    "Saint Vincent and the Grenadines": "VC", "Samoa": "WS", "San Marino": "SM", "Sao Tome and Principe": "ST",
    "Saudi Arabia": "SA", "Senegal": "SN", "Serbia": "RS", "Seychelles": "SC", "Sierra Leone": "SL",
    "Singapore": "SG", "Slovakia": "SK", "Slovenia": "SI", "Solomon Islands": "SB", "Somalia": "SO",
    "South Africa": "ZA", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR",
    "Svalbard and Jan Mayen": "SJ", "Swaziland": "SZ", "Sweden": "SE", "Switzerland": "CH",
    "Syrian Arab Republic": "SY", "Taiwan, Province of China": "TW", "Tajikistan": "TJ",
    "Tanzania, United Republic of": "TZ", "Thailand": "TH", "Timor-Leste": "TL", "Togo": "TG",
    "Tokelau": "TK", "Tonga": "TO", "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR",
    "Turkmenistan": "TM", "Turks and Caicos Islands": "TC", "Tuvalu": "TV", "Uganda": "UG",
    "Ukraine": "UA", "United Arab Emirates": "AE", "United Kingdom": "GB", "United States": "US", "UK": "GB",
    "United States Minor Outlying Islands": "UM", "Uruguay": "UY", "Uzbekistan": "UZ", "Vanuatu": "VU",
    "Venezuela": "VE", "Viet Nam": "VN", "Virgin Islands, British": "VG", "Virgin Islands, U.S.": "VI",
    "Wallis and Futuna": "WF", "Western Sahara": "EH", "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW"
}

def write_json_file(file_path, data):
    """Escribe datos en un archivo JSON de forma legible."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ ¡Éxito! Se ha creado/actualizado el archivo '{file_path}'.")
    except Exception as e:
        print(f"❌ Error al escribir el archivo '{file_path}': {e}")


def generate_facebases_files(root_dir):
    """Genera facebases.json y categories.json."""
    facebases_dir = os.path.join(root_dir, 'photos', 'facebases')
    if not os.path.isdir(facebases_dir):
        print(f"⚠️  Advertencia: No se encontró el directorio '{facebases_dir}'. Saltando la generación de facebases.")
        return

    nombres_facebases = []
    categorias_detectadas = set()

    for filename in sorted(os.listdir(facebases_dir)):
        if filename.endswith(".png"):
            nombre_sin_extension = os.path.splitext(filename)[0]
            nombres_facebases.append(nombre_sin_extension)
            if '-' in nombre_sin_extension:
                categoria = nombre_sin_extension.split('-')[0]
                categorias_detectadas.add(categoria)

    # Escribir facebases.json
    write_json_file(os.path.join(facebases_dir, 'facebases.json'), nombres_facebases)

    # Generar y escribir categories.json
    estructura_categorias = {"countries": [], "others": []}
    for categoria in sorted(list(categorias_detectadas)):
        if categoria in ISO_COUNTRY_CODES:
            estructura_categorias['countries'].append({"name": categoria, "iso": ISO_COUNTRY_CODES[categoria]})
        else:
            print(f"ℹ️  Info: '{categoria}' no es un país reconocido, se tratará como categoría 'otra'.")
            estructura_categorias['others'].append({"name": categoria, "flag": f"photos/app/{categoria}.png"})
    
    write_json_file(os.path.join(facebases_dir, 'categories.json'), estructura_categorias)


def generate_items_file(root_dir):
    """Genera items.json (solo avatares/accesorios, NO texturas)."""
    items_dir = os.path.join(root_dir, 'photos', 'items')
    if not os.path.isdir(items_dir):
        print(f"⚠️  Advertencia: No se encontró el directorio '{items_dir}'. Saltando la generación de ítems.")
        return

    nombres_items = []
    for filename in sorted(os.listdir(items_dir)):
        if filename.endswith(".png"):
            nombre_sin_extension = os.path.splitext(filename)[0]
            # Excluir cualquier archivo de textura con el formato antiguo (Texture-...)
            # La limpieza manual de esta carpeta es la forma más segura.
            if nombre_sin_extension.lower().startswith("texture-"):
                print(f"⚠️  Advertencia: El archivo '{filename}' parece ser una textura antigua. Debe moverlo/renombrarlo.")
                continue
            nombres_items.append(nombre_sin_extension)
    
    write_json_file(os.path.join(items_dir, 'items.json'), nombres_items)


def generate_textures_file(root_dir):
    """
    Genera textures.json a partir de los archivos PNG en 'photos/textures'.
    Asume que los nombres han sido renombrados (e.g., de Texture-M-Dress_... a M-Dress_...).
    """
    textures_dir = os.path.join(root_dir, 'photos', 'textures')
    if not os.path.isdir(textures_dir):
        print(f"⚠️  Advertencia: No se encontró el directorio '{textures_dir}'. Saltando la generación de texturas.")
        return

    nombres_texturas = [os.path.splitext(filename)[0] for filename in sorted(os.listdir(textures_dir)) if filename.endswith(".png")]
    
    # Escribir textures.json
    write_json_file(os.path.join(textures_dir, 'textures.json'), nombres_texturas)


if __name__ == "__main__":
    # El script asume que está en el directorio raíz del proyecto
    project_root_directory = os.path.dirname(os.path.abspath(__file__))
    
    print("--- Iniciando la generación de archivos JSON ---")
    
    # 1. Generar Facebases (no se altera)
    generate_facebases_files(project_root_directory)
    print("-" * 20)
    
    # 2. Generar Items (Avatares/Accesorios)
    generate_items_file(project_root_directory)
    print("-" * 20)
    
    # 3. Generar Textures (NUEVO)
    generate_textures_file(project_root_directory)
    
    print("--- Proceso completado ---")