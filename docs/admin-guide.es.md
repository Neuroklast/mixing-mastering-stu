# Manual de administrador

Esta guía está escrita para el **propietario del sitio** — no se requieren conocimientos técnicos.

---

## Inicio de sesión

1. Ve a `https://tu-dominio.com/admin/login`
2. Introduce tu correo electrónico y contraseña de administrador
3. Serás redirigido al **Panel de administración**

Si ves "Forbidden", pide a tu desarrollador que asigne el rol `admin` a tu cuenta en la base de datos de Supabase.

---

## Panel de control

El panel (`/admin`) muestra un resumen de todas las secciones de contenido. Cada tarjeta indica cuántos elementos hay actualmente en la base de datos y un enlace para gestionar esa sección.

---

## Hero y textos del sitio (`/admin/content`)

Edita todos los textos visibles para los visitantes en el sitio público:

- **Hero** — texto del badge, títulos principales, subtítulo, etiquetas de botones
- **About** — título y cuerpo del apartado "Sobre nosotros"
- **Contacto** — correo electrónico, teléfono, dirección
- **Social links** — URLs de Instagram, SoundCloud, Spotify
- **Footer** — tagline

Haz clic en **Save all changes** cuando hayas terminado.

---

## Pistas de Showcase (`/admin/showcase`)

Las pistas de showcase son las comparaciones de audio antes/después en la página principal.

### Añadir una nueva pista

1. Haz clic en **+ New**
2. Rellena los campos:
   - **Title** *(obligatorio)* — nombre de la pista (p. ej. "INCINERATE")
   - **Artist** — nombre del artista
   - **Genre** — género musical (opcional)
   - **Equipment** — equipo utilizado (opcional)
   - **Label Before / Label After** — etiqueta mostrada en el toggle del reproductor (por defecto: "Demo" / "Final")
   - **Start Marker (s)** — tiempo de inicio de reproducción en segundos (por defecto: 0)
   - **LUFS Target** — sonoridad objetivo en LUFS (por defecto: -14)
   - **Display Order** — los números más bajos aparecen primero
   - **Active** — ponlo en **Yes** para que la pista sea visible en el sitio público
3. Sube los archivos de **Before Audio** y **After Audio**
   - Formatos admitidos: WAV, MP3, FLAC
   - Los archivos se almacenan en Cloudflare R2
4. Haz clic en **Create**

### Editar o eliminar

Haz clic en **Edit** junto a cualquier pista. Para eliminar, haz clic en **Delete** (se te pedirá confirmación).

---

## Galería (`/admin/gallery`)

La galería muestra fotos del estudio en el sitio público.

### Añadir imágenes

1. Haz clic en **+ New**
2. Sube una imagen (JPG o PNG, máx. 100 MB)
3. Añade un **alt text** (descripción para accesibilidad)
4. Añade una **leyenda** opcional
5. Establece el **Display Order** y activa **Active**
6. Haz clic en **Save**

> **Consejo:** Las imágenes se almacenan en Cloudflare R2 (bucket `sonorativa-media`).

---

## Miembros / Equipo (`/admin/members`)

Gestiona los perfiles del equipo que se muestran en el sitio público.

### Añadir un miembro del equipo

1. Haz clic en **+ New**
2. Rellena **Name** *(obligatorio)*, **Role** *(obligatorio)* y **Bio**
3. Sube una **foto de perfil** (las fotos cuadradas funcionan mejor)
4. Añade **social links** opcionales: Instagram, SoundCloud, Spotify
5. Establece el **Display Order** y activa **Active**
6. Configura **Featured**:
   - **No** — el miembro aparece en la cuadrícula
   - **Yes** — el miembro aparece como retrato completo con bio encima de la cuadrícula
7. Haz clic en **Create**

---

## Servicios y precios (`/admin/services`)

Gestiona los paquetes de servicios que se muestran en el modal de servicios.

### Campos

| Campo | Descripción |
|---|---|
| Slug | Identificador compatible con URL (p. ej. `mixing`) — debe ser único |
| Title | Nombre que se muestra (p. ej. "Mixing") |
| Description / Tagline | Descripción corta que aparece bajo el título |
| Price (cents) | Precio en la unidad monetaria más pequeña (p. ej. 20000 = 200 €) |
| Currency | `eur`, `usd`, etc. |
| Duration | Plazo de entrega (p. ej. "3–5 días") |
| Features | Una característica por línea — solo listar lo que está incluido |
| Display Order | Menor = aparece antes |
| Active | Activar/desactivar visibilidad |

---

## Reseñas (`/admin/reviews`)

Gestiona las reseñas de clientes que se muestran en el sitio público.

### Añadir una reseña manualmente

1. Haz clic en **+ New**
2. Rellena:
   - **Client Name** *(obligatorio)*
   - **Rating (1–5)** *(obligatorio)*
   - **Text** *(obligatorio)* — el cuerpo de la reseña
   - **Service** — Mix, Master, Mix & Master o Producing
   - **Date** — fecha de la reseña
   - **Project Link** — URL opcional del proyecto
3. Haz clic en **Create**

> **Nota:** Las reseñas deben activarse manualmente — en el formulario de edición, pon **Active** en **Yes** para que sean visibles públicamente.

---

## Créditos (`/admin/credits`)

Los créditos son la discografía / lista de clientes que se muestra en el sitio.

### Añadir un crédito

1. Haz clic en **+ New**
2. Rellena **Name** *(obligatorio)* (artista o banda)
3. Selecciona **Role** *(obligatorio)*: Mix, Master, Mix & Master o Producing
4. Añade el **Year** (opcional)
5. Añade opcionalmente una **Spotify URL** y sube una **imagen de portada**
6. Activa **Featured** para destacar el crédito
7. Haz clic en **Create**

---

## Páginas legales (`/admin/legal`)

Edita el Impressum y la Datenschutzerklärung (aviso legal y política de privacidad).

1. Haz clic en la página que deseas editar
2. Edita el contenido HTML directamente en el área de texto
3. Haz clic en **Save**

---

## Explorador de medios (`/admin/media`)

Navega por todos los archivos almacenados en Cloudflare R2. Se muestran dos buckets:

- **sonorativa-media** — imágenes (galería, fotos de miembros, portadas de créditos)
- **sonorativa-audio** — archivos de audio (pistas antes/después del showcase)

Usa esta página para verificar subidas y copiar rutas de almacenamiento si es necesario.

---

## Consejos

- Los cambios están **activos inmediatamente** después de guardar — no hay caché que limpiar.
- Si una sección sigue mostrando "contenido de demostración" después de añadir una entrada, asegúrate de que el nuevo elemento esté marcado como **Active**.
- Para restaurar el contenido de demostración de una sección, elimina todos los elementos de esa sección desde el panel de administración.
