#!/bin/zsh
# Runs one Codex session per batch file, in parallel. Finished images are skipped,
# so the script can simply be re-run after a failure.
cd "${0:A:h}/../.."
for batch in art-src/jobs/${1:-batch}-*.json; do
  name=${batch:t:r}
  codex exec --skip-git-repo-check -C "$PWD" -c model_reasoning_effort="low" \
"Use the imagegen skill in its default built-in mode (the image_gen tool). Process every job in $batch, in order.
For each job: if the file at job.out already exists, skip it. Otherwise call the image_gen tool once with job.prompt as the prompt (landscape 1536x1024), passing job.ref (an absolute path) in referenced_image_paths when the job has a ref. If a call fails with a tool or argument error, fix the arguments and retry, at most twice. Then copy the exact PNG produced by that call (the file for that generation inside \$CODEX_HOME/generated_images/<this session id>/) to job.out.
Do not rewrite or embellish the prompts, do not make extra variants, and do not modify any other files. When every job is done, print the list of output paths." \
    > "art-src/jobs/$name.log" 2>&1 &
done
wait
