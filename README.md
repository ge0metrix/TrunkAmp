# Trunk Recorder Pro interface template

A starting point for a [Trunk Recorder Pro](https://github.com/TrunkRecorder/trunk-recorder-pro)
interface: a small working example, and a release workflow that packages it the way the
recorder's interface store installs it.

An interface is a web page, HTML, JavaScript and CSS with no server side, that the recorder
serves on a port of its own, with its API beside it. A scanner wall, a player, a page for the
phone in your pocket: anything people who listen, rather than run the recorder, would open.

The example here, in `interface/`, shows what's on the air now, the last 20 recorded calls
(press one to play it), and a **Listen live** button. It works at phone width, follows the
system's light or dark mode, and loads nothing from the internet.

## Try it

You need Trunk Recorder Pro on your computer. From this folder:

```sh
trunk-pro --ui ./interface
```

The recorder serves the folder on the next free port above its own and opens it in your
browser. Files are read on every request: edit, then reload. Nothing is saved to the config,
and for that run the page has control access, so it can do everything the built-in interface
can.

## Make it yours

1. **Use this template** on GitHub (or copy it) to make your interface's repository.
2. In `interface/interface.json`, set `id`, `name`, `description`, and `repository` (your
   repository's URL).
3. Replace `interface/index.html`, `app.js` and `style.css` with your interface. Any layout
   works, and subfolders are fine; `index.html` is the page it opens on.
4. Replace `interface/screenshots/main.png` with a real screenshot. The one here is a
   placeholder with no text in it.
5. Rewrite this README for your interface's users.

Refer to your own files with relative paths (`./app.js`) and to the recorder with absolute ones
(`/api/client.js`, `/api/ws`, `/calls/…`). Don't put files under `api/` or `calls/`: those
paths are the recorder's. Don't hard-code a host or port: `new TrunkClient()` connects to the
page's own. And load nothing from a CDN, because a recorder may have no internet.

The recorder serves its API guide at `/api/docs`, and `/api/client.js` is the client library
the example uses: `TrunkClient` keeps the connection and the recorder's state, `LivePlayer`
plays live audio, and `escapeHtml` makes text safe to put in a page.

## `interface.json` and screenshots

```json
{
  "id": "my-interface",
  "name": "My interface",
  "version": "0.1.0",
  "description": "Calls on the air, the latest recorded calls, and live audio.",
  "api": 1,
  "access": "listen",
  "license": "MIT",
  "screenshots": [
    { "path": "screenshots/main.png", "caption": "Calls on the air, and the latest recorded" }
  ]
}
```

`id` is lowercase letters, digits and `-`, up to 64 characters; `version` is a semantic version.
There's no author field: the store shows the GitHub account your repository is in.

`screenshots` are what the store shows before anyone installs it, and the first one leads. Up to
6, each a `.png`, `.jpg` or `.webp` of at most 2 MB in the interface's folder, with file names
that differ from each other. About 1280 × 800 reads well. Show it as it is in this version, with
nothing private in it (no real unit names or talkgroups you shouldn't share).

Every key is in
[Publishing an interface](https://github.com/TrunkRecorder/trunk-recorder-pro/blob/main/docs/interfaces/publishing.md).

## Listen or control

`access` says what the interface needs:

- **`listen`** (the default): it sees everything the recorder shows (status, calls on the air,
  recorded calls, live audio, the dashboard's figures) and plays every call. It can't change
  anything.
- **`control`**: everything the built-in interface can do, including changing the config and
  starting and stopping recording.

Ask for listen unless the interface must change the recorder. One that asks for control is
reviewed more closely, and users are warned before installing it. Either way, the user can
change what it gets at any time.

## Releasing

1. Set `version` in `interface/interface.json`, and commit.
2. Tag the commit with the version, prefixed with `v`, and push the tag:
   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. The **Release** workflow checks `interface.json` and that the tag matches its version, then
   publishes a GitHub release with:

   | File | |
   |---|---|
   | `<id>-<version>.zip` | One folder, `<id>-<version>/`, with everything in `interface/` |
   | `<id>-<version>-<file name>` | Each screenshot, on its own, for the store |
   | `SHA256SUMS` | Checksums of all of the above |

   Every file also gets a **build provenance attestation**: a signed record, kept by GitHub,
   that Actions built it from your repository at the tagged commit. The registry checks it.

To see what a release will hold, run `.github/package.sh`. It writes the same files into
`dist/`. Keep a `CHANGELOG.md` with a `## [0.1.0]` heading for each version, and the workflow
uses that section as the release notes.

**Keep the file names.** The recorder's installer and the registry find the files by name.

A release can be installed before it's listed, with **Install from GitHub…** on the Interfaces
page or `trunk-pro interface install <you>/<repo>`. That checks the zip against the release's
`SHA256SUMS` and gives it listen access only, since nobody has reviewed it.

## Listing it in the store

The store lists interfaces from the
[registry](https://github.com/TrunkRecorder/interfaces). Once you've released:

1. Fork the registry and add your entry:
   ```sh
   ./add-release https://github.com/you/your-interface v0.1.0
   ./check interfaces/your-interface.json
   ```
   `add-release` writes `interfaces/<id>.json` from your release, and `check` downloads it and
   checks it.
2. Open a pull request. A maintainer reviews it.

To release an update, do the same with the new tag. The registry's
[README](https://github.com/TrunkRecorder/interfaces#readme) says what the checks and the
review look at.

## License

The template is MIT-licensed; your interface can use any license you like.
