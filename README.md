# BackupManifest
Tools for recursively generating hash manifests for whole directories of files. Useful for backup validation.

Currently provides two tools

1. Given a directory, create a hash and filesize referencing manifest file as JSON
2. Given two directories, two manifest files, or any combination of the two, find the differences, if any

## Installation

TODO

## Generating Manifests

Run the index file with the -m option and a directory path

```
> node index.js -m DIRECTORY_TO_ANALYZE
```

For example, to generate a manifest of one of the sample directories, you would run

```
> node index.js -m sampleDirs/dir1
```

The output would be the manifest for that directory in JSON

```
{"./file1.txt":[4129824372,16],"./file2.txt":[772802917,16],"./file3.txt":[460735586,0],"./file5.txt":[231742841,4],"./file6.txt":[3195845697,4]}
```

You can always redirect the standard out to a file to save the manifest, like so

```
> node index.js -m sampleDirs/dir1 > dir1Manifest.json
```

## Comparing Directories and Manifests

Comparisons between directories are always done by generating the manifest first, so it doesn't matter whether you try to compare two directories, two manifests, a manifest and a directory, or a directory and a manifest. All will work the same way. Comparing two directories is similar to diffing the two directories. Comparing two manifests is equivalent to diffing the two directories at the time their manifests were made. Comparing a manifest and a directory is useful for verifying that the contents of the directories (and their files) have not changed since the manifest was generated.

Compare two things with the -c option and two manifests/directories

```
> node index.js -c DIRECTORY_OR_MANIFEST_1 DIRECTORY_OR_MANIFEST_2
```

For example, if you had already generated a manifest for dir1 (the sample directory) and wanted to check that it hadn't changed, you would run

```
> node index.js -c dir1Manifest.json sampleDirs/dir1
```

Since the files in `sampleDirs/dir1` have not changed, no report string will be generated

When comparing a manifest to a directory that does have differences...

```
> node index.js -c dir1Manifest.json sampleDirs/dir2
```

You will get a report back like this one

```
Files with identical path (./file1.txt) differ by hash (4129824372 vs 1760961163) and 
Files with identical path (./file5.txt) differ by hash (231742841 vs 3215682498) and filesize (4 vs 8)
File (./file3.txt) only exists in the first directory
File (./file6.txt) only exists in the first directory; similar file(s) in other directory, moved?: ./file6moved.txt
File (./file4.txt) only exists in the second directory
File (./file6moved.txt) only exists in the second directory; similar file(s) in other directory, moved?: ./file6.txt
File (./file7.txt) only exists in the second directory
```

Note: file2.txt is not listed because it is both the same and has the same path relative to its directory. Also, notice that the hash and filesize values will be used to attempt to find moved files.

## Manifest Format

A manifest is a JavaScript object (converted to JSON) with the keys being the relative path to the file and the value an array containing the computed hash and the filesize, in that order.

For example

```
{
    "./file1.txt": [4129824372, 16],
    "./file2.txt": [772802917, 16]
}
```

* The paths `./file1.txt` and `file2.txt` are relative to the directory that was the root of the manifest generation (`sampleDirs/dir1` in this case). They are relative paths so that two directories can be in different containing folders and yet be directly compared
* `4129824372` and `772802917` are the hash values for `file1.txt` and `file2.txt`, respectively
* `file1.txt` and `file2.txt` share the same `16` filesize value (in bytes)

## Gotchas

Because this is primarily a tool for verifying backups and to avoid issues with system files, files preceeded with a period (like .DS_Store) will be ignored. Directories starting with periods (like .git) WILL be traversed, however.

## Speed

Cryptographic security when generating hashes is not necessary for this use case, so this tool uses [xxHash](https://github.com/mscdex/node-xxhash), which is an order of magnitude (at least) faster than MD5 in my tests.

I ran a few tests in a thoroughly un-rigorous way on my local machine. I generated manifests for a couple representative directories

* 17.55 GB of large files (directory containing video, audio, and executables)
* 1.11 GB of small files (directory containing four large git repositories)

Manifests generation results

* Large file directory: 17.55 GB in 46.6 seconds, 0.37661 GB/s
* Small file directory: 1.11 GB in 191.6 seconds, 0.00579 GB/s

As you can see with the speed report above, generating a manifest for a few large files is much faster than generating a manifest for lots of small files. It appears that this algorithm is limited by I/O speed more than anything, but it is still far faster than MD5 and other traditional hash generators.

Comparing the two output manifests is even faster

* Large file manifest: 25 KB of JSON
* Small file manifest: 10,670.6 KB of JSON
* Comparison report generated in 2.3 seconds

As a final note, all the the heavy lifting functions (the hasher and file readers) are built as streams and async, so running these commands do not consume all that much resources.