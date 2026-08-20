# DSH 音乐插件

<p align="center">
  <img src="https://raw.githubusercontent.com/syy-shark/dsh-music-plugin/9397ed7fae64303b5f4fdd32d38ba89db5ea135e/docs/deepseek-whale-music.png" alt="DeepSeek 鲸鱼听歌" width="360">
</p>

给 DeepSeek Harness 加一个音乐开关：Agent 能搜、播、暂停你电脑里的歌。关掉插件，声音也会停。

今天接的是本机文件夹。以后要接网易云或加播放器界面，都走这个开关，不用推倒重来。

## 怎么用

1. 把歌放进 `~/Music`（就是 Mac「音乐」文件夹）。
2. 装一次（写进 DSH 配置，以后不用再贴路径）：

```sh
npx @deepseek-ai/dsh plugin --profile web add /Users/shark/项目/DSH-music-plugin
```

3. 以后直接启动：

```sh
npx @deepseek-ai/dsh web
```

打开 `http://127.0.0.1:3080`。右侧会出现「本地音乐」面板：能看见歌单，点播放 / 暂停 / 下一首。也可以继续跟 Agent 说「播放 xxx」，两边是同一套播放。

拔掉：

```sh
npx @deepseek-ai/dsh plugin --profile web remove dsh-music-plugin
```

开发时还可以用 `--patch` 临时挂源码，不写进配置。

能听到声音就算成了。找到好几首时，Agent 会列出路径，你让它按准确路径再播一次。

## 它能干什么

| 你说的 | Agent 会调 |
| --- | --- |
| 找一下某首歌 | `music_search` |
| 播放 xxx | `music_play` |
| 暂停 / 继续 | `music_pause` / `music_resume` |
| 下一首 | `music_skip` |
| 现在在播什么 | `music_status` |

正在播的时候再点播，会排进队列，不会把当前这首掐掉。

出声用 Mac 自带的 `afplay`。电脑里有 `mpv` 的话会优先用它（flac 更稳）。

## 配置

都在 [`cordis.yml`](cordis.yml) 里，改完重新加载即可：

- `libraryDir`：歌在哪个文件夹，默认 `~/Music`
- `backend`：`auto` / `afplay` / `mpv`
- `extensions`：当音乐文件的后缀

## 给别的插件用

别的 DSH 插件可以 `inject: ['music']`，然后调 `ctx.music.play / pause / search`。不用自己去扫文件夹、也不用管 `afplay`。

## 这次没做

网易云、进度条拖拽、歌词。先做到打开网页就能看见歌、点一下能出声。
