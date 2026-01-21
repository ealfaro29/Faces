import os
import sys
from PIL import Image
from pathlib import Path

def convert_images(directory, delete_original=False):
    """
    Recorre el directorio recursivamente y convierte PNG a WebP.
    """
    root_path = Path(directory)
    if not root_path.exists():
        print(f"El directorio {directory} no existe.")
        return

    print(f"🔄 Iniciando conversión de imágenes en: {directory}")
    
    count = 0
    total_saved = 0
    
    for file_path in root_path.rglob("*.png"):
        try:
            webp_path = file_path.with_suffix('.webp')
            
            # Si ya existe y es más reciente, saltar
            if webp_path.exists() and webp_path.stat().st_mtime > file_path.stat().st_mtime:
                continue

            with Image.open(file_path) as img:
                # Mantener transparencia si existe, convertir a RGBA si es necesario
                if img.mode in ('P', 'L'):
                    img = img.convert('RGBA')
                
                img.save(webp_path, 'WEBP', quality=85)
                
            orig_size = file_path.stat().st_size
            new_size = webp_path.stat().st_size
            saved = orig_size - new_size
            total_saved += saved
            count += 1
            
            print(f"✅ Convertido: {file_path.name} ({orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB)")
            
            if delete_original:
                file_path.unlink()
                print(f"🗑️ Eliminado original: {file_path.name}")
                
        except Exception as e:
            print(f"❌ Error convirtiendo {file_path}: {e}")

    mb_saved = total_saved / (1024 * 1024)
    print(f"\n🎉 Proceso finalizado.")
    print(f"🖼️ Imágenes procesadas: {count}")
    print(f"💾 Espacio ahorrado (estimado): {mb_saved:.2f} MB")

if __name__ == "__main__":
    # Por defecto busca en la carpeta 'photos' del directorio actual
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "photos"
    # Pasar 'True' como segundo argumento para borrar originales
    delete_orig = len(sys.argv) > 2 and sys.argv[2].lower() == 'true'
    
    convert_images(target_dir, delete_original=delete_orig)
