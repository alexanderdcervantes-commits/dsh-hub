# dsh-media-preview

[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)

Audio and video preview for the DeepSeek Harness (dsh) web GUI, registered as
a **FileViewer** inside
[dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar). Open an
`.mp4`/`.webm`/`.mkv`/`.mov`/… or `.mp3`/`.flac`/`.wav`/… file in the sidebar
file tree and it plays inline with native controls.

| Video | Audio |
|-|-|
|<img width="679" height="643" alt="image" src="https://github.com/user-attachments/assets/061d92cb-4418-47d1-86bd-be52a9950dbc" />|<img width="692" height="542" alt="image" src="https://github.com/user-attachments/assets/74df4ef9-aa98-4be7-bdf1-852eed2ed51d" /> | 


## Why a dedicated route

better-sidebar's built-in `/sidebar/file` media route reads whole files into
memory, has **no HTTP Range support**, and caps at an image-oriented size
limit. This package serves media through its own streaming route
(`/media-preview/file`) with:

- HTTP **Range** (206) seeking — the browser can jump anywhere in a long video
- Streamed responses (`fs.createReadStream`) — no whole-file buffering
- Whole-filesystem scope behind the same browser trust fence the built-in
  `/api` documents (loopback Host + same-origin markers), matching the
  official directory-picker browse backend — the sidebar explorer browses
  outside the session cwd (e.g. a music folder in `~/Documents`), and media
  files must play wherever the explorer can open them

## Supported extensions

Video: `mp4 webm mov m4v mkv avi ogv ts 3gp flv`
Audio: `mp3 wav ogg oga m4a aac flac opus weba wma`

Extension-less media is still claimed via magic-byte sniffing (`ftyp`,
EBML, `OggS`, `fLaC`, RIFF/WAVE, RIFF/AVI, ID3, MP3 frames).

## Install

```sh
dsh plugin --profile web add github:tsonglew/dsh-media-preview
```

(Requires `dsh-better-sidebar` ≥ 0.4.0, which exposes
`ctx.betterSidebar.registerFileViewer`.)

## Configuration

All fields optional (profile patch layer):

```yaml
- id: media-preview
  config:
    maxMediaBytes: 2147483648  # hard cap on one served file (default 2 GiB)
    trustedHosts: []           # extra non-loopback authorities
```

## License

MIT
