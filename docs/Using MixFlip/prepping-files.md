---
title: Prepping Your Audio Files
description: How to prep your files for uploading to MixFlip
sidebar:
  order: 2
---

## Introduction

Before you upload your files to MixFlip, you need to make sure they are prepped correctly. This means that they lined up correctly, have the correct sample rate, and are in the correct format.

## Lining up Before and After Audio

Because MixFlip does not encode your audio (what you upload is what is streamed to the user), you need to make sure that your audio is lined up correctly before uploading. Here's our recommended workflow:

### Step 1: Find Your Source "Before" and "After" Audio

Find which source audio files you want to use for your before and after audio. This will proabably mean finding the rough mix the client sent you, then finding your final mix or master.

It's ok if they're not the exact length or sample rate or bit depth at this point, but just try to use some sort of lossess version of the files.

### Step 2: Drop Those Two Files Into Your DAW to Line Up

Drop the two files into your DAW. You'll now want to select which parts of the song you want to use. You're free to use the entire song, or just a part of it (MixFlip supports files up to 60MB). We usually reccomend using a snippet both for showing the "best" part of the song, but also becasue it keeps file sizes down when the user plays the files.

Once you have the sections you want, line them up visually, but also check how the sync sounds by using an exclusive solo mode in your DAW and switching between the two files.

![Lined Up Audio](../../../assets/linedupindaw.jpeg)

### Step 3: Export Your Files and Convert to Your Desired Format

Now that you have the files lined up, you can export them – this can either be done as a WAV or directly to an MP3 or FLAC if desired.

While we support MP3, FLAC, and WAV files, we generally reccomend using MP3 files for website-visitor experience (especially if you want to upload an entire song). To read more about which file fortmats we support and reccomend, check out [Supported Audio Formats](../supported-audio-formats). Using the LAME encoder is also reccomended for MP3 files, as it's the best sounding encoder out there.

If you're looking for a high-qaulity audio encoder program for creating MP3, we reccomend using [XLD](https://sourceforge.net/projects/xld/) on Mac as it's free and supports the LAME encoder. It also can also convert WAV files to FLAC files.

Our reccomended settings for converting WAV files to MP3 with XLD are:
![XLD](../../../assets/XLD_LAME.png)

### Step 4: Doublecheck the Sync

We reccomend dropping the files you just lined up into a FRESH DAW session to just double check that the sync sounds right
