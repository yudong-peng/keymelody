# 第三方素材说明

本项目打包的六种采样音色采用 Creative Commons CC0 1.0 Universal：
https://creativecommons.org/publicdomain/zero/1.0/

| 网站音色 | 原始音色／项目 | 来源 |
| --- | --- | --- |
| 立式钢琴 | FreePats Upright Piano KW (small), 2019-07-03 | https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html#UprightKW |
| 古典吉他 | FreePats Spanish Classical Guitar, 2019-06-18 | https://freepats.zenvoid.org/Guitar/acoustic-guitar.html |
| 卡林巴 | FreePats Kalimba, 2019-07-23 | https://freepats.zenvoid.org/Ethnic/kalimba.html |
| 羽管键琴 | Versilian Studios VCSL English Harpsichord | https://github.com/sgossner/VCSL |
| 木琴 | Versilian Studios VCSL Xylophone | https://github.com/sgossner/VCSL |
| 钟琴 | Versilian Studios VCSL Glockenspiel | https://github.com/sgossner/VCSL |

FreePats录音者及贡献者详见 `dist/audio/licenses/piano-readme.txt`、`guitar-readme.txt`、`kalimba-readme.txt`。VCSL原始说明和CC0文本保留在同一目录。

加工说明：精选单力度／单次采样，转为单声道32kHz MP3，截短至最多6秒、峰值归一化、淡出尾音。保留Kalimba SFZ微调，并将VCSL音名编号转换为科学MIDI音高。播放通过最近根音变调，不包含完整SFZ循环、松键和轮替层。

每个采样的原文件名、原始下载URL、原始SHA-256及发声根音记录在 `dist/audio/manifest.json`。保留这些说明便于追溯；上述CC0授权仅适用于列出的音色素材。
