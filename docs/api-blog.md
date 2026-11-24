# Blog ingest API

`POST /api/blog` creates a blog post. Any system holding an API key can call it, for example a content generator.

## Authentication

API keys are created in the dashboard under **API keys** (`/admin/api-keys`, admins only). The full key is shown once, when it is created. The database stores only its SHA-256 hash and a short prefix that tells keys apart in the list. Each request sends the key in a header:

```
Authorization: Bearer mrd_...
```

The response is `401` with `{ "error": "API key inválida o revocada." }` and `WWW-Authenticate: Bearer` in these cases:

- the header is missing or malformed;
- the key does not exist;
- the key was revoked.

The key is checked before the body is read, so without a valid key the body is never read. Each successful post records the key's last use, which the dashboard shows.

A key is revoked from the same dashboard page, and it keeps the date it was first revoked. Revoking a key that is already revoked or no longer exists, for example from a stale tab, changes nothing and shows «Esta key ya estaba revocada o no existe.».

Each key decides what happens to the posts it creates:

- **Publicar los posts directamente** (the default): the post is published, dated at the time of the request.
- Unchecked: the post is saved as a draft, to be published from the dashboard under **Blog**.

## Body

JSON, up to 1 MB. Validation and HTML sanitizing are the same as in the dashboard editor.

| Field | Required | What it is |
| --- | --- | --- |
| `title` | Yes | Title, up to 200 characters. |
| `description` | Yes | Summary, up to 300 characters. |
| `content` | Yes | Post HTML. It is sanitized before it is stored: scripts, styles, event attributes, and any URL with a scheme other than `https` (links may also use `mailto`) are removed, and an `h1` becomes an `h2`. Relative URLs (`/servicios`, `#section`) are kept, so posts can link to other pages of the site. An image or link pointing into the image library (`R2_PUBLIC_URL/media/...`) must be the exact URL of an image in the library, like the cover; images and links elsewhere are not checked. |
| `slug` | No | Taken from the title when missing. If another post in the same language already uses it, the request fails with `400` (see below); the slug is never renamed silently. |
| `locale` | No | `es` (the default) or `en`. |
| `img` | No | Cover image. It must come from the dashboard image library (`R2_PUBLIC_URL/media/...`); any other URL returns `400`. The path is checked after `..` segments are resolved, so `R2_PUBLIC_URL/media/../x.png` is outside the library; an encoded slash (`%2F`, `%5C`) in the path is refused too. It must also be the exact URL of an image in the library, as the dashboard picker gives it: a variant of that URL (another letter case in the host, a query such as `?v=1`, a `sub/../` path) or an image that was deleted returns `400`. |
| `imgAlt` | No | Alt text for the cover. |
| `tags` | No | `"a, b"` or `["a", "b"]`. Missing tags are created in that language. Up to 20 different tags. |
| `categories` | No | `["Ecommerce"]` or `[{ "name": "Ecommerce" }]`. Missing categories are created in that language. Up to 10 different categories. |
| `seoTitle`, `seoDescription` | No | Up to 70 and 160 characters. |

Each tag and category name needs letters or numbers and at most 60 characters. Names that give the same slug count once. A name that breaks the rule, or one too many, fails the request with `400`: nothing is dropped or cut silently. In the `"a, b"` form an empty piece, such as a trailing comma, is ignored.

## Responses

`201`:

```json
{ "id": "…", "slug": "choosing-an-online-store", "locale": "en", "status": "PUBLISHED", "url": "https://mrdesign.com.co/en/blog/choosing-an-online-store" }
```

`status` is `DRAFT` when the key leaves posts as drafts. After a post is created, the blog in both languages (index, posts and category pages) is revalidated, the same as after a save in the dashboard.

`400`, naming each field that failed with the API's field names. The messages are in Spanish, as in the dashboard:

```json
{ "error": "Datos inválidos.", "fields": { "title": "Escribe el título." } }
```

| Case | `fields` |
| --- | --- |
| The body is not a JSON object | `{ "body": "El cuerpo tiene que ser un objeto JSON." }` |
| A text field has another JSON type, for example `{"title": 123}` | `{ "title": "Tiene que ser texto." }` |
| `tags` is not text or a list of texts | `{ "tags": "Usa texto separado por comas o una lista de textos." }` |
| `categories` is not a list | `{ "categories": "Usa una lista de nombres." }` |
| A tag or category name is empty, has no letters or numbers, or is over 60 characters | `{ "tags": "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres." }` (`categories` alike) |
| More than 20 tags or 10 categories | `{ "tags": "Máximo 20 etiquetas." }`, `{ "categories": "Máximo 10 categorías." }` |
| Another request created the same new tag or category at the same time | `{ "tags": "Otra petición creó las mismas etiquetas a la vez. Vuelve a intentarlo." }` (`categories` alike). Nothing was stored, so the request can be sent again. |
| The slug is taken in that language | `{ "slug": "Ya existe un post con ese slug en este idioma." }` |
| The cover is not an `https` URL, for example `http://…` | `{ "img": "La portada tiene que ser una URL https." }` |
| The cover is outside the image library | `{ "img": "La portada tiene que estar en la biblioteca de imágenes del panel." }` |
| The cover points into the image library but is not the exact URL of an image there (deleted, never uploaded, or a variant of its URL) | `{ "img": "La portada no está en la biblioteca de imágenes del panel: puede que la hayan borrado." }` |
| An image or link in `content` points into the image library but is not the exact URL of an image there | `{ "content": "La imagen <url> no está en la biblioteca de imágenes del panel: puede que la hayan borrado." }`, one sentence per such URL. |
| Unknown language | `{ "locale": "Elige un idioma." }` |

The library check runs with the write: an image deleted from the dashboard while the request is in flight either waits for the post to be stored (the delete is then refused because the image is in use) or makes the request fail with the `400` above. Nothing is stored in that case.

The body is not valid JSON: `400` with `{ "error": "El cuerpo no es JSON válido." }`.

The post clashes with a stored row on a unique rule other than the ones above: `400` with `{ "error": "Otro registro ya usa alguno de estos datos. Revisa el post y vuelve a intentarlo." }` and no `fields`. Nothing was stored.

`413` when the body is larger than 1 MB. The size is counted in bytes as the body arrives, with or without `Content-Length`.

## Request limit

Each key can send 60 requests per hour. Every request with a valid key counts, whatever its answer (`201`, `400` or `413`); requests refused with `401` count for no key. The limit is checked after the key and before the body is read, so over the limit nothing is read or stored. The 61st request within the hour gets `429`:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{ "error": "Demasiadas solicitudes con esta API key. Vuelve a intentarlo más tarde." }
```

`Retry-After` is in whole seconds and is always the full window (one hour), the longest a key ever waits; the key may be allowed again earlier, as its oldest requests leave the window. Refused requests do not count.

The counter lives in the server's memory: it is per container and starts over when the container restarts. That is enough for the single Dokploy container this site runs on; scaling out to several containers needs a shared store. The limit is set in `src/lib/blog/ingest-rate-limit.ts`.

## Example

```bash
curl -X POST https://mrdesign.com.co/api/blog \
  -H "Authorization: Bearer mrd_..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Choosing an online store","description":"What to check before picking Shopify or PrestaShop.","content":"<p>…</p>","locale":"en","tags":"shopify, prestashop","categories":["Ecommerce"]}'
```
