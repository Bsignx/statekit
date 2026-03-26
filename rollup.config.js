import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/statekit.esm.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/statekit.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: 'dist/statekit.umd.js',
      format: 'umd',
      name: 'StateKit',
      sourcemap: true,
    },
  ],
  plugins: [terser()],
};
