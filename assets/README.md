# Assets Directory

The frontend keeps external build artefacts in this folder. None of the contents are
committed because they are produced by the installation scripts.

## Generated subdirectories

- `client/` – created temporarily by [`install_client.sh`](../install_client.sh).
  The script clones the Vue.js client repository from GitLab, installs
  its dependencies, and builds the static bundle. The build output is moved into
  `vuejs/` and the cloned repository is left in place for subsequent updates.
- `vuejs/` – target directory that ultimately serves the compiled client
  application. It is emptied on every run of `install_client.sh` before the new
  build artefacts are copied in.
- `data/` – created by [`install_data.sh`](../install_data.sh). The script clones
  the musical dataset repository from GitLab and uses its `Makefile` to
  generate the alternate formats consumed by the frontend.

Run either script with the `--verify` flag to check that the required tools are
installed before attempting to fetch the remote repositories.
