import { useEffect } from 'react';

/* ============================================================
   usePageMeta — SEO por ruta para una SPA sin server-side render.
   ------------------------------------------------------------
   Actualiza document.title y la meta description en el <head> al
   montar cada página. No reemplaza SSR real, pero ayuda a Google
   (que sí ejecuta JS al indexar) y mejora el título que se ve en
   la pestaña del navegador / historial / favoritos.
   ============================================================ */

function setMetaByName(name, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function usePageMeta({ title, description, robots } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const prevOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const prevOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const prevRobots = document.querySelector('meta[name="robots"]')?.getAttribute('content');

    if (title) {
      document.title = title;
      setMetaByProperty('og:title', title);
      setMetaByName('twitter:title', title);
    }
    if (description) {
      setMetaByName('description', description);
      setMetaByProperty('og:description', description);
      setMetaByName('twitter:description', description);
    }
    // Páginas transaccionales (ej. retorno de pago) no aportan valor de
    // búsqueda y pueden leerse como contenido fino/duplicado: se excluyen
    // del índice pasando robots: 'noindex, nofollow' explícitamente.
    if (robots) {
      setMetaByName('robots', robots);
    }

    // Al desmontar, restauramos lo anterior para no filtrar el título de
    // una página a otra si el usuario navega rápido.
    return () => {
      document.title = prevTitle;
      if (prevDescription) setMetaByName('description', prevDescription);
      if (prevOgTitle) setMetaByProperty('og:title', prevOgTitle);
      if (prevOgDescription) setMetaByProperty('og:description', prevOgDescription);
      if (robots && prevRobots) setMetaByName('robots', prevRobots);
    };
  }, [title, description, robots]);
}
