import withMT from "@material-tailwind/react/utils/withMT";
import type { Config } from "tailwindcss";

export default withMT({
  content: [
    "./index.html",
    "./resources/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}) satisfies Config;
