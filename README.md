# github-stats

## Usage

```
export USER=github-handle
github-stats summary --users $USER -o qubitdigital -o QubitProducts -f
github-stats text --users $USER -o qubitdigital -o QubitProducts > $USER-prs.txt
github-stats text --users $USER -o qubitdigital -o QubitProducts --commits > $USER-commits.txt

github-stats summary --users $USER -o qubitdigital -o QubitProducts -s 2018-07-01 -e 2018-11-01

github-stats members organisation
```

Note: github api results are cached to avoid rate limits - to get fresh results use --fresh

you need to add your github token to config/local.yml