import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StyleManager {
  isDark = true;

  toggleDarkTheme() {
    if (this.isDark) { 
      this.removeStyle('dark-theme');
      document.body.classList.remove('dark-theme');
      const href = "styles.css";
      //styles.css is already imported by angular  
      getLinkElementForKey("light-theme").setAttribute('href',href);
      document.body.classList.add('light-theme');
      this.isDark = false; 
    } else {
      this.removeStyle('light-theme');
      document.body.classList.remove('light-theme');
      const href = 'dark.css';
      //dark.css content is moved to styles.css
      getLinkElementForKey('dark-theme').setAttribute('href', href);
      document.body.classList.add('dark-theme');
      this.isDark = true;
    }
  }

  removeStyle(key: string) {
    const existingLinkElement = getExistingLinkElementByKey(key);
    if (existingLinkElement) {
      document.head.removeChild(existingLinkElement);
    }
  }
}

function getLinkElementForKey(key: string) {
  return getExistingLinkElementByKey(key) || createLinkElementWithKey(key);
}

function getExistingLinkElementByKey(key: string) {
  return document.head.querySelector(
    `link[rel="stylesheet"].${getClassNameForKey(key)}`
  );
}

function createLinkElementWithKey(key: string) {
  const linkEl = document.createElement('link');
  linkEl.setAttribute('rel', 'stylesheet');
  linkEl.classList.add(getClassNameForKey(key));
  document.head.appendChild(linkEl);
  return linkEl;
}

function getClassNameForKey(key: string) {
  return `style-manager-${key}`;
}