{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs-22_x
  ];
  idx.extensions = [
    "svelte.svelte-vscode",
    "vue.volar"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm",
          "run",
          "dev",
          "--",
          "--port",
          "$PORT",
          "--host",
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}