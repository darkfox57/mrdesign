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

Each key decides what happens to the posts it creates:

- **Publicar los posts directamente** (the default): the post is published, dated at the time of the request.
- Unchecked: the post is saved as a draft, to be published from the dashboard under **Blog**.

## Body

JSON, up to 1 MB. Validation and HTML sanitizing are the same as in the dashboard editor.

| Field | Required | What it is |
| --- | --- | --- |
| `title` | Yes | Title, up to 200 characters. |
| `description` | Yes | Summary, up to 300 characters. |
| `content` | Yes | Post HTML. It is sanitized before it is stored: scripts, styles, event attributes, links other than `https` or `mailto`, and non-`https` images are removed, and an `h1` becomes an `h2`. |
| `slug` | No | Taken from the title when missing. If another post in the same language already uses it, the request fails with `400` (see below); the slug is never renamed silently. |
| `locale` | No | `es` (the default) or `en`. |
| `img` | No | Cover image. It must come from the dashboard image library (`R2_PUBLIC_URL/media/...`); any other URL returns `400`. |
| `imgAlt` | No | Alt text for the cover. |
| `tags` | No | `"a, b"` or `["a", "b"]`. Missing tags are created in that language. Up to 20. |
| `categories` | No | `["Ecommerce"]` or `[{ "name": "Ecommerce" }]`. Missing categories are created in that language. Up to 10. |
| `seoTitle`, `seoDescription` | No | Up to 70 and 160 characters. |

## Responses

`201`:

```json
{ "id": "…", "slug": "choosing-an-online-store", "locale": "en", "status": "PUBLISHED", "url": "https://mrdesign.agency/en/blog/choosing-an-online-store" }
```

`status` is `DRAFT` when the key leaves posts as drafts. After a post is created, the blog index in both languages and the post's own page are revalidated.

`400`, naming each field that failed with the API's field names. The messages are in Spanish, as in the dashboard:

```json
{ "error": "Datos inválidos.", "fields": { "title": "Escribe el título." } }
```

| Case | `fields` |
| --- | --- |
| The body is not a JSON object | `{ "body": "El cuerpo tiene que ser un objeto JSON." }` |
| The slug is taken in that language | `{ "slug": "Ya existe un post con ese slug en este idioma." }` |
| The cover is outside the image library | `{ "img": "La portada tiene que estar en la biblioteca de imágenes del panel." }` |
| Unknown language | `{ "locale": "Elige un idioma." }` |

The body is not valid JSON: `400` with `{ "error": "El cuerpo no es JSON válido." }`.

`413` when the body is larger than 1 MB. The size is counted in bytes as the body arrives, with or without `Content-Length`.

## Example

```bash
curl -X POST https://mrdesign.agency/api/blog \
  -H "Authorization: Bearer mrd_..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Choosing an online store","description":"What to check before picking Shopify or PrestaShop.","content":"<p>…</p>","locale":"en","tags":"shopify, prestashop","categories":["Ecommerce"]}'
```
