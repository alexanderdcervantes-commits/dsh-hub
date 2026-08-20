# wcocr: demonstrate how to use WeChatOCR.exe

Great thanks to IEEE by his [Project IEEE/QQImpl](https://github.com/EEEEhex/qqimpl)] and [article](https://bbs.kanxue.com/thread-278161.htm).
This project is based on it and reduced the product size by using `protobuf-lite` instead of `protobuf`.

This project provided a direct Python interface for calling in sync mode as well as other languages support including but not limited with c++/java/c#.

## DeepSeek Harness plugin

This repository can be installed as a [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness) plugin:

```powershell
dsh plugin add github:hawkhai/wechat-ocr
```

It registers `wechat_ocr_recognize`, a model-facing tool that accepts a local image path and returns recognized text together with WeChat OCR's structured result. OCR runs locally; the image is not sent to an external OCR service.

Configure `wechatOcrPath` (the WeChat 3.x `WeChatOCR.exe`, WeChat 4.x `wxocr.dll`, or Linux OCR binary) and `wechatPath` (the matching WeChat runtime directory) in the plugin row. You may instead set `WECHAT_OCR_PATH` and `WECHAT_PATH`. The default `python` must match one of the bundled Windows extension builds (CPython 3.7, 3.11, or 3.12); `pythonBin` and `moduleDir` are configurable.

# Prepare for usage

To work with this project, you need to prepare the wechat OCR binary and the wechat runtime folder.

For wechat 3.x, the wechat OCR binary is `wechatocr.exe`, it might be:

```
C:\Users\yourname\AppData\Roaming\Tencent\WeChat\XPlugin\Plugins\WeChatOCR\7061\extracted\WeChatOCR.exe
```
and the wechat runtime folder might be:
```
C:\Program Files (x86)\Tencent\WeChat\[3.9.8.25]
```

**Wechat 4.0 is now supported!**

For wechat 4.0, the wechat OCR binary is `wxocr.dll`, it might be:

```
C:\Users\yourname\AppData\Roaming\Tencent\xwechat\XPlugin\plugins\WeChatOcr\8011\extracted\wxocr.dll
```

and the wechat runtime folder might be:

```
C:\Program Files\Tencent\Weixin\4.0.0.26
```

## Warning

WeChat 4.0 OCR binary is `wxocr.dll`, but this project built a DLL named `wcocr.dll`

**Their names are similar, DO NOT confuse them.**



# Linux is now supported

![linux supported](https://raw.githubusercontent.com/hawkhai/wechat-ocr/8f6254d9545643ad68fc2967c22240cb4fa433b2/doc/images/linux-spt.jpg)

Typically, You should use `/opt/wechat/wxocr` as the OCR exe path and `/opt/wechat/` as the WeChat folder path.

The other usages are similar to those on Windows.

## C++ interface

You can use the following code to test it:
```cpp
CWeChatOCR ocr(wechatocr_path, wechat_path);
if (!ocr.wait_connection(5000)) {
	// error handling
}
CWeChatOCR::result_t result;
ocr.doOCR("D:\\test.png", &result);
```
You can also pass `nullptr` to the second parameter of `doOCR` to call in async mode and wait the callback.
In this case, you need to subclass `CWeChatOCR` and implement the virtual function `OnOCRResult`.

## Python interface
Rename the built `wcocr.dll` to `wcocr.pyd` and put it in the same directory as `test.py`.
You can use the following code to test it:

```python
import wcocr
wcocr.init(wechatocr_path, wechat_path)
result = wcocr.ocr("D:\\test.png")
```

Currently, the python interface only supports sync mode.

## Java interface

* see java/Test.java
* I'm not so familiar with java and don't know how to pass complex data structures, so I just passed a JSON string from cpp to java.
* The added DLL export function `wechat_ocr` can also be used in other scenarios.

## C Sharp (C#) interface
* see `c_sharp` folder.
* It's important to ensure the built dll is copied to the folder test_cs.exe in! always copy the 64bit version dll!
* It's ok to built a 32bit test_cs.exe and copy the 32bit dll, you can try.
