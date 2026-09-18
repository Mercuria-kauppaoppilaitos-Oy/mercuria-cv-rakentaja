import type { JSX as ReactJSX } from 'react';

// react-easy-crop 6.2 uses the pre-React-19 name for its render return type.
declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
  }
}
