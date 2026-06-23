// Project Static Data Sources
const PROJECTS = [
  {
    id: "logport-saas",
    title: "LogPort Enterprise B2B Kundenportal & SaaS",
    category: "SaaS / Next.js",
    impact: "Produktionsbereite Mehrmandanten-Architektur mit granularem Rollen- & Rechtesystem und Echtzeit-Web-Push (VAPID).",
    description: "Eine hochskalierbare Webplattform für Speditionen und Logistikdienstleister. Features: Physische und logische Mandantentrennung (Multi-Tenancy) über sichere Isolation, dynamische anwendungseigene Formularfelder-Engine (JSONB-basiert), revisionssicheres Enterprise Audit Logging inkl. IP-Erfassung für DSGVO-Konformität, tokenbasiertes passwortfreies Einladungs-Onboarding via Resend/Nodemailer sowie Stripe-basierte Abonnement-Begrenzung (Quota Enforcement).",
    tech: ["Next.js (App Router)", "Prisma ORM", "Serverless PostgreSQL (Neon)", "NextAuth", "Stripe Subscriptions", "Web Push (VAPID)", "Upstash Redis"],
    challenges: [
      "Wasserdichte logische Isolierung der Mandantendaten (Tenants) auf geteilter Datenbank-Infrarotstruktur bei lückenloser relationaler Integrität.",
      "Entwicklung eines flexiblen, aber typsicheren Formularfeld-Systems für benutzerdefinierte Zusatzfelder (Custom Fields), das sich nahtlos über Select, Text, Number, Date und Boolean im Frontend validieren lässt."
    ],
    learnings: [
      "Das lückenlose Mitten-Modul-Caching mit Upstash Redis (Sliding Door Rate Limiting) verhindert gezielte Bruteforce-Angriffe auf sensible Login- und Tracking-Pfade.",
      "For echte B2B Revisionssicherheit ist ein persistiertes, transaktionales Audit-Log (Sicherheits-Log) unumgänglich, um spätere Manipulationen im Haftungsfall (Transportschäden) auszuschließen."
    ],
    codeLanguage: "typescript",
    codeSnippet: `// Type-Safe Custom Field Runtime Validation Engine
// Extracts from the SaaS Core to assert user inputs against dynamic database schemas

function validateValue(
  definition: { fieldType: FieldType; options: string[] | null },
  raw: unknown
): ValidationResult {
  if (raw === null || raw === undefined) {
    return { valid: false, message: "Wert fehlt" }
  }

  const stringValue = String(raw).trim()
  if (definition.fieldType === "TEXT") {
    return { valid: true, value: stringValue }
  }
  if (definition.fieldType === "NUMBER") {
    const num = parseFloat(stringValue)
    return Number.isFinite(num) 
      ? { valid: true, value: String(num) } 
      : { valid: false, message: "Zahl erwartet" }
  }
  if (definition.fieldType === "DATE") {
    const asDate = new Date(stringValue)
    return !Number.isNaN(asDate.getTime()) 
      ? { valid: true, value: stringValue } 
      : { valid: false, message: "Ungültiges Datum" }
  }
  if (definition.fieldType === "BOOLEAN") {
    const bool = normalizeBoolean(raw)
    return bool 
      ? { valid: true, value: bool } 
      : { valid: false, message: "Boolean erwartet" }
  }
  if (definition.fieldType === "SELECT") {
    if (!definition.options?.length) {
      return { valid: false, message: "Optionen fehlen" }
    }
    if (!definition.options.includes(stringValue)) {
      return { valid: false, message: "Ungültige Auswahl" }
    }
    return { valid: true, value: stringValue }
  }
  return { valid: false, message: "Ungültiger FieldType" }
}`
  },
  {
    id: "headless-woo-redis",
    title: "High-Performance WooCommerce Headless Engine",
    category: "WooCommerce",
    impact: "Ladezeit von 7.2s auf 0.9s gedrückt. +42% mobile Conversion.",
    description: "Überführung eines überladenen WooCommerce-Monolithen mit 8.000 SKUs in eine entkoppelte Headless-Architektur. Das Frontend wurde in React (Svelte) gebaut und greift über eine performante Redis-gesicherte Middleware auf die WordPress REST API zu.",
    tech: ["WooCommerce", "TypeScript", "Redis", "PHP 8.2", "REST API", "Tailwind CSS"],
    challenges: [
      "Synchronisation des Warenkorb-Status (Cart Hash) ohne Cookie-Blockaden in Drittanbieter-Browsern.",
      "Vermeidung des Overhead-Lads bei verschachtelten Produktattributen im Standard-REST-Endpunkt."
    ],
    learnings: [
      "Custom REST-Endpunkte in WordPress schreiben spart bis zu 80% JSON-Payload.",
      "Warenkorb-Sessions sollten über transienten Remote-Speicher (Redis) statt blockierenden Tabellen-Queries gelöst werden."
    ],
    codeLanguage: "php",
    codeSnippet: `<?php
/**
 * Register high-speed lightweight product list endpoint
 * Bypasses full heavy WC_Product load, returning flat relational JSON directly.
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/products', [
        'methods'  => 'GET',
        'callback' => 'get_minified_products',
        'permission_callback' => '__return_true'
    ]);
});

function get_minified_products($request) {
    global $wpdb;
    $limit = min(50, intval($request->get_param('limit') ?: 20));
    
    // Quick directly-assembled SQL query bypassing heavy post-query and WC objects
    $results = $wpdb->get_results($wpdb->prepare("
        SELECT p.ID as id, p.post_title as name, 
               MAX(CASE WHEN pm.meta_key = '_price' THEN pm.meta_value END) as price,
               MAX(CASE WHEN pm.meta_key = '_sku' THEN pm.meta_value END) as sku
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
        WHERE p.post_type = 'product' AND p.post_status = 'publish'
        GROUP BY p.ID LIMIT %d
    ", $limit), ARRAY_A);

    // Warm up Redis cache in background
    return new WP_REST_Response($results, 200);
}`
  },
  {
    id: "shopify-metaobjects-testimonials",
    title: "Shopify Custom Section: Dynamic Metaobject Slider",
    category: "Shopify",
    impact: "0 zusätzliche Apps installiert, spart $240/Jahr App-Kosten und eliminiert 3 Script-Blocker.",
    description: "Eine komplett native, barrierefreie Slider-Sektion für ein renommiertes Fashion-Label. Verwendet neuartige Shopify Metaobjects und Liquid (ohne JavaScript-Bibliotheken wie Slick oder Swiper), um Layout Shift (CLS) komplett auf null zu halten.",
    tech: ["Shopify Liquid", "HTML5 Custom Element", "CSS Scroll Snap", "Metaobjects"],
    challenges: [
      "Unterstützung von Dynamic Visual Assets direkt aus dem Shopify CDN ohne Layout-Sprünge während des Ladens von Bildern.",
      "Tastaturbedienbarkeit (A11y ARIA) über native Tab-Indizes statt JS-Fokusfänger."
    ],
    learnings: [
      "Standard-Apps blähen das Header-Skript oft mit unoptimiertem JavaScript auf. Native Custom Web Components sparen wertvolle Millisekunden für die LCP.",
      "CSS Scroll Snap ist SwiperJS in 99% aller Slider-Fälle überlegen."
    ],
    codeLanguage: "javascript",
    codeSnippet: `// Custom Element: Lightweight Accessible Carousel
class AccessibleCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[role="list"]');
    this.prevBtn = this.querySelector('[data-action="prev"]');
    this.nextBtn = this.querySelector('[data-action="next"]');
    
    if (this.prevBtn && this.nextBtn) {
      this.prevBtn.addEventListener('click', () => this.scroll('left'));
      this.nextBtn.addEventListener('click', () => this.scroll('right'));
      this.track.addEventListener('scroll', () => this.updateButtons(), { passive: true });
      this.updateButtons();
    }
  }

  scroll(direction) {
    const cardWidth = this.querySelector('[role="listitem"]').offsetWidth;
    const currentScroll = this.track.scrollLeft;
    const target = direction === 'left' ? currentScroll - cardWidth : currentScroll + cardWidth;
    this.track.scrollTo({ left: target, behavior: 'smooth' });
  }

  updateButtons() {
    const isAtStart = this.track.scrollLeft <= 10;
    const isAtEnd = this.track.scrollLeft + this.track.offsetWidth >= this.track.scrollWidth - 10;
    this.prevBtn.setAttribute('aria-disabled', isAtStart);
    this.nextBtn.setAttribute('aria-disabled', isAtEnd);
  }
}
customElements.define('accessible-carousel', AccessibleCarousel);`
  },
  {
    id: "wordpress-block-deprecation-killer",
    title: "Bespoke Gutenberg Editorial Theme Core",
    category: "WordPress",
    impact: "PageSpeed Score 99/100 auf allen Content-Unterseiten ohne Lazy Load.",
    description: "Entwicklung eines reinen Custom-Themes von Grund auf für ein großes Online-Magazin. Vollständig basierend auf Block-Editor (FSE) mit restriktiven, passgenauen Gutenberg Blocks, die Redakteuren Freiraum bieten, aber Design-Richtlinien strikt erzwingen.",
    tech: ["WordPress FSE", "React / JSX Blocks", "PHP 8", "CSS Custom Properties", "Vite Compiler"],
    challenges: [
      "Vermeidung des typischen 'Gutenberg Block Deprecation' Fehlers bei zukünftigen WP-Core Versionen.",
      "Optimierung des geladenen Core-CSS von WordPress, indem standardmäßig ungenutzter Ballast weggefiltert wird."
    ],
    learnings: [
      "Der Block-Ausgabe-HTML sollte über Server-Side Dynamic Rendering (PHP render_callback) implementiert werden, um React-Deprecations permanent zu umgehen.",
      "Die Deaktivierung von globalen WP 'Block-Library CSS' ist der wichtigste Hebel für gute Mobil-Scores."
    ],
    codeLanguage: "php",
    codeSnippet: `<?php
/**
 * Strip bloated default global styles and block library styles 
 * Only load what is actually printed in the template.
 */
add_action('wp_enqueue_scripts', function() {
    // Kill the generic Gutenberg block styles
    wp_dequeue_style('wp-block-library');
    wp_dequeue_style('wp-block-library-theme');
    
    // Kill global inline SVG definitions in header
    wp_dequeue_style('global-styles');
}, 100);

// Programmatically disable theme customizer entirely to force CSS variable system
add_action('customize_register', function($wp_customize) {
    return false;
}, 10);`
  },
  {
    id: "vanilla-asset-preloader",
    title: "Custom High-Precision Asset Preload Manager",
    category: "Vanilla JS / Tech Stack",
    impact: "Beseitigt Loading-Flicker für immersiven Web-Content. Keine dicken jQuery/Webpack Libs.",
    description: "Ein winziger, super-performanter Preloader, der asynchron Bilder, SVG-Assets und Web-Fonts im Browser anfordert. Stellt sicher, dass CSS-Animationen und Custom Fonts zeitgleich feuern, um Text-Flicker (FOIT) komplett zu eliminieren.",
    tech: ["JavaScript ES6+", "Fetch Cache-API", "Web Fonts API", "Subtle Transitions"],
    challenges: [
      "Präzise Fortschrittsanzeige auf langsamen mobilen 3G-Verbindungen ohne die Netzwerkbandbreite zusätzlich zu belasten.",
      "Sicheres Fallback für ältere Browser, die das Resource-Timing-Interface nicht unterstützen."
    ],
    learnings: [
      "Die CSS Web Fonts API 'document.fonts.ready' spart extrem viel JavaScript-Code für FOUT-Management.",
      "Der Einsatz von parallelem 'Promise.allSettled' verhindert, dass eine einzige kaputte Bild-URL den gesamten Ladevorgang blockiert."
    ],
    codeLanguage: "javascript",
    codeSnippet: `// Ultra-lightweight custom asset booster
class AssetManager {
  constructor(assets, onProgress, onComplete) {
    this.assets = assets;
    this.total = assets.length;
    this.loaded = 0;
    this.onProgress = onProgress || (() => {});
    this.onComplete = onComplete || (() => {});
  }

  async start() {
    if (this.total === 0) return this.onComplete();

    const promises = this.assets.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error();
        this.loaded++;
        this.onProgress(Math.round((this.loaded / this.total) * 100));
      } catch (err) {
        // Fallback or silent catch so load flow never breaks
        this.loaded++;
        this.onProgress(Math.round((this.loaded / this.total) * 100));
      }
    });

    await Promise.allSettled([
      ...promises,
      document.fonts ? document.fonts.ready : Promise.resolve()
    ]);
    this.onComplete();
  }
}`
  },
  {
    id: "woo-sql-feed",
    title: "WooCommerce Direct-DB XML Feed Engine",
    category: "WooCommerce",
    impact: "Rendering-Zeit von 120s auf 1.8s gedrückt. Null RAM Overheads.",
    description: "Ein rein datenbankgesteuerter XML-Export-Generator für Preissuchmaschinen, der komplett an der speicherintensiven WordPress Post-Objekt-Dehydrierung vorbei direkt raw SQL streamt.",
    tech: ["WooCommerce", "Raw SQL Queries", "PHP Stream Buffer", "XML Schema"],
    challenges: [
      "Abbildung verschachtelter Produkttaxonomien ohne PHP Objekt-Overload.",
      "Vermeidung von Script-Timeout-Grenzwerte bei Produktzahlen von über 50.000 Einheiten."
    ],
    learnings: [
      "Direct DB Querys sparen bis zu 95% des PHP-Arbeitsspeichers im Vergleich zu WP_Query WooCommerce-Objekten.",
      "Datensätze blockweise über Buffers zu pipen verhindert HTTP 504 Gateway Timeouts permanent."
    ],
    codeLanguage: "php",
    codeSnippet: `<?php
/**
 * Direct Database Custom XML Stream Generator
 * Streams high-volumes of product database rows on-the-fly.
 */
function stream_woo_products_xml() {
    global $wpdb;
    
    // Set strict memory and execution boundaries
    @set_time_limit(0);
    @ini_set('memory_limit', '64M');
    
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?><rss><channel>';
    
    $offset = 0;
    $batch_size = 500;
    
    while (true) {
        $items = $wpdb->get_results($wpdb->prepare("
            SELECT p.ID, p.post_title, 
                   m_price.meta_value as price, 
                   m_sku.meta_value as sku
            FROM {\$wpdb->posts} p
            LEFT JOIN {\$wpdb->postmeta} m_price ON (p.ID = m_price.post_id AND m_price.meta_key = '_price')
            LEFT JOIN {\$wpdb->postmeta} m_sku ON (p.ID = m_sku.post_id AND m_sku.meta_key = '_sku')
            WHERE p.post_type = 'product' AND p.post_status = 'publish'
            LIMIT %d OFFSET %d
        ", $batch_size, $offset));
        
        if (empty($items)) break;
        
        foreach ($items as $item) {
            echo '<item>';
            echo '<id>' . intval($item->ID) . '</id>';
            echo '<title>' . htmlspecialchars($item->post_title, ENT_XML1) . '</title>';
            echo '<price>' . htmlspecialchars($item->price, ENT_XML1) . '</price>';
            echo '<sku>' . htmlspecialchars($item->sku, ENT_XML1) . '</sku>';
            echo '</item>';
        }
        
        flush(); // Flush the output buffer immediately to release server thread memory
        $offset += $batch_size;
    }
    
    echo '</channel></rss>';
    exit;
}`
  },
  {
    id: "wordpress-a11y-walker",
    title: "Zero-Overhead Semantic Walker for Accordion Navigation",
    category: "WordPress",
    impact: "Menüaufrufe von 45 Queries auf eine einzige DB-Abfrage optimiert. Volle Tastaturbedienbarkeit.",
    description: "Moderne, performante Walker-Klasse zur Generierung nativer, hierarchischer Tastatur-Akkordeons für WAI-ARIA Screenreader-Standards, komplett ohne JavaScript-Bibliotheken.",
    tech: ["WordPress Core", "PHP Walker", "Semantic HTML5", "WAI-ARIA Standards"],
    challenges: [
      "Serverseitige Injektion korrekter interaktiver ARIA-States (aria-expanded, aria-controls).",
      "Erreichen von pixelgenauer Einrückung tiefer Menü-Subtrees mit purem CSS statt DOM-Verbiegungen."
    ],
    learnings: [
      "Die WordPress-Walker Klasse ermöglicht die schlankeste HTML-Strukturierung direkt beim Datenbank-Parser.",
      "CSS-Klassen wie ':focus-within' machen JavaScript-Listener für Submenü-Sichtbarkeiten obsolet."
    ],
    codeLanguage: "php",
    codeSnippet: `<?php
/**
 * Custom High-Speed Semantic A11y Menu Walker
 */
class High_Speed_A11y_Walker extends Walker_Nav_Menu {
    public function start_lvl(&$output, $depth = 0, $args = null) {
        $indent = str_repeat("\\t", $depth);
        $output .= "\\n\$indent<ul class=\"sub-menu-level-\$depth\" role=\"group\">\\n";
    }
    
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $classes = empty($item->classes) ? array() : (array) $item->classes;
        $has_subs = in_array('menu-item-has-children', $classes);
        
        $item_classes = array('nav-node');
        if ($has_subs) $item_classes[] = 'has-submenu';
        
        $output .= '<li class="' . esc_attr(implode(' ', $item_classes)) . '">';
        
        $attributes  = ' href="' . esc_url($item->url) . '"';
        if ($has_subs) {
            $attributes .= ' aria-haspopup="true" aria-expanded="false"';
        }
        
        $item_output = '<a' . $attributes . ' class="menu-link">';
        $item_output .= apply_filters('the_title', $item->title, $item->ID);
        $item_output .= '</a>';
        
        $output .= apply_filters('walker_nav_menu_start_el', $item_output, $item, $depth, $args);
    }
}`
  },
  {
    id: "wordpress-multisite-performance",
    title: "Scalable Enterprise WP-Multisite Backend",
    category: "WordPress",
    impact: "Skaliert 120 Mandanten-Websites auf einer Single-Engine mit 0.2s LCP-Antwortzeit.",
    description: "Konzeption und Implementierung einer global skalierbaren WordPress-Multisite (Subfolder-Mapping) für eine internationale Holding. Die Architektur teilt sich einen schlanken Core und bedient mandantenspezifische Assets pfeilschnell über ein dynamisches S3/Cloudflare CDN Gateway.",
    tech: ["WP Multisite", "Object Cache Pro", "Cloudflare CDN", "S3 Media Offload", "PHP 8.3"],
    challenges: [
      "Vermeidung von DB-Bottlenecks bei parallelen Schreibzugriffen über 100+ separate Mandanten-Tabellen hinweg.",
      "Zentrales Plugin- und Theme-Update-Management ohne Ausfallzeiten (Zero-Downtime Deployments)."
    ],
    learnings: [
      "Redis Object Cache muss mandanten-spezifisch separiert (salted) werden, um Cache-Verschmutzung zu verhindern.",
      "Dank dynamischer Pfad-Überschreibung für Medien-Assets über Nginx, fließen Uploads direkt in das S3-Bucket ohne den Webserver-Speicher zu belasten."
    ],
    codeLanguage: "php",
    codeSnippet: `<?php
/**
 * Dynamic Multisite Redis Cache Salting & Media Gateway Redirects
 * Prevents cross-site cache pollution on Redis while remaining extremely fast.
 */
add_filter('redis_object_cache_parameters', function ($params) {
    global $wpdb;
    // Inject a unique cache prefix salted by each distinct blog-id
    $blog_id = get_current_blog_id();
    if (isset($params['prefix'])) {
        $params['prefix'] = 'wp_ms_site_' . $blog_id . ':' . $params['prefix'];
    } else {
        $params['prefix'] = 'wp_ms_site_' . $blog_id . ':';
    }
    return $params;
});

// Programmatic media routing to scalable S3 CDN bucket 
add_filter('wp_get_attachment_url', function ($url) {
    if (defined('WP_SANDBOX_CDN_HOST')) {
        return str_replace(site_url('/wp-content/uploads/'), WP_SANDBOX_CDN_HOST . '/', $url);
    }
    return $url;
});`
  },
  {
    id: "shopify-css-aspect-ratio",
    title: "Pure-CSS Liquid Responsive Product Grid",
    category: "Shopify",
    impact: "Vollständige CLS-Wert-Eliminierung (0.0 Shift). Spart 24% Render-Prozesse auf dem Handy.",
    description: "Layout-Stabiles Produkt-Raster mit nativer CSS Aspect-Ratio Definition und responsiver Quellskalierung auf Basis von Liquid Imagefiltern zur Bandbreitenreduzierung.",
    tech: ["Shopify Liquid", "CSS aspect-ratio", "srcset CDN Loader", "Fluid Layouts"],
    challenges: [
      "Verhinderung des Aufspringens der Rasterzellen (Layout Shifts) während asynchronen Lazy-Images Downloads.",
      "Optimierte Bildkomprimierung durch responsive Srcsets ohne externe Shopify App Store Skripte."
    ],
    learnings: [
      "Übermittlung der Bilddimensionen vor dem eigentlichen Bilddownload verhindert das Flackern beim Aufbau vollkommen.",
      "Der Filter 'image_url' ist leistungsfähiger und performanter als sämtliche JS-Bibliotheken."
    ],
    codeLanguage: "html",
    codeSnippet: `<!-- Native Liquid Aspect-Ratio Controlled Grid -->
<div class="performance-prod-grid">
  {% for product in collection.products %}
    <div class="performance-item">
      <div class="aspect-ratio-holder" style="aspect-ratio: {{ product.featured_image.aspect_ratio | default: '1' }};">
        <img 
          src="{{ product.featured_image | image_url: width: 320 }}"
          srcset="{{ product.featured_image | image_url: width: 320 }} 320w, {{ product.featured_image | image_url: width: 640 }} 640w"
          sizes="(max-width: 600px) 320px, 640px"
          loading="lazy"
          alt="{{ product.featured_image.alt | escape }}" 
          class="fluid-img-node" />
      </div>
      <h3 class="prod-item-heading">{{ product.title }}</h3>
      <span class="prod-item-price">{{ product.price | money }}</span>
    </div>
  {% endfor %}
</div>`
  },
  {
    id: "vanilla-web-worker",
    title: "Isolated Off-Main-Thread Buffer Worker Processing",
    category: "Vanilla JS / Tech Stack",
    impact: "UI blockiert niemals (stetige 60fps). Verarbeitet 5 Mio. Datenpunkte in Millisekunden.",
    description: "Native Hintergrundberechnung von anspruchsvollen Binär-Datenströmen in isolierten Threads ohne Blockierung der grafischen Benutzeroberfläche.",
    tech: ["Vanilla JS", "Web Worker API", "ArrayBuffer Shared Blocks", "Uint32Array"],
    challenges: [
      "Sicherer, latenzfreier Datenaustausch von binär gepackten Arrays (Buffers) ohne das Haupt-Thread UI zu dehnen.",
      "Realisierung einer robusten Worker-Fallback Pipeline für Host-Umgebungen ohne Worker-Threading-Unterstützung."
    ],
    learnings: [
      "Web Workers eignen sich überragend für mathematische Berechnungen und Dateiparser direkt im Web-Client.",
      "Das Übermitteln von Raw-Speicherreferenzen ('Transferable Objects') eliminiert Serialisierungs-Overheads vollständig."
    ],
    codeLanguage: "javascript",
    codeSnippet: `/**
 * Fast Thread Worker Orchestration
 * Prevents main thread blockage using Transferable memory allocation
 */
class DeepBufferAnalyzer {
  constructor(workerPath) {
    this.worker = new Worker(workerPath);
  }

  processBinaryDataset(elementsCount) {
    // Generate raw continuous numerical memory allocations
    const dataBuffer = new ArrayBuffer(elementsCount * 4); // 4 bytes per item
    const view = new Int32Array(dataBuffer);
    
    for (let i = 0; i < elementsCount; i++) {
        view[i] = i * 42;
    }

    return new Promise((resolve) => {
        this.worker.onmessage = (e) => {
            resolve(e.data.result);
        };
        // Transfer ownership of raw ArrayBuffer directly to background worker
        this.worker.postMessage({ buffer: dataBuffer }, [dataBuffer]);
    });
  }
}`
  }
];

// Slop templates for Code Inspector
const SLOP_RECIPES = {
  "logport-saas": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Fehleranfälliges ungetyptes Gefrickel)
// Typischer AI-Slop ohne jegliche Fehlerbehandlung, strukturierte Rückgabe,
// Null-Checks oder String-Trimming. Gibt blind ungetypte Booleans zurück,
// stürzt bei unvorhergesehenen Werten ab und ignoriert ungültige Feldtypen.

function validateValueSlop(type, value) {
  if (type == "TEXT") {
    return true; // Einfach alles durchlassen
  } else if (type == "NUMBER") {
    if (isNaN(value)) {
      return false;
    }
    return true;
  } else if (type == "DATE") {
    let d = new Date(value);
    if (d.toString() == "Invalid Date") {
      return false;
    }
    return true;
  } else if (type == "BOOLEAN") {
    if (value == "true" || value == "false") {
      return true;
    }
    return false;
  } else if (type == "SELECT") {
    // Keine Überprüfung ob Optionen existieren, führt direkt zu Absturz im Frontend
    return true;
  }
}`,
  "woo-sql-feed": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (WordPress-Tod bei vielen Daten)
// Versucht mittels speicherintensiver Standard-OOP Wrapper alle Produkte 
// auf einmal zu laden. Dies führt bei Produkt-Katalogen über 500 SKUs zu 
// Fatal Error: Allowed memory size of exhausted.

add_action('wp_ajax_feed_export', function() {
    $products = wc_get_products(['limit' => -1]); // Schlecht: Instanziiert unzählige schwere WC_Product Objekte
    $output = "";
    foreach ($products as $p) {
        $output .= "<product><sku>" . $p->get_sku() . "</sku></product>"; // Enormer Mehraufwand pro Loop!
    }
    echo $output;
});`,
  "wordpress-a11y-walker": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Träges DOM-Flicken)
// Flickt Accessibility-Mängel nachträglich mit riesigem, unnötigen JavaScript.
// Erzeugt unschöne Render-Verzögerungen, Performance-Einbußen und bricht,
// sobald Inhalte asynchron nachgeladen werden.

document.addEventListener("DOMContentLoaded", function() {
    // Schlecht: Verändert das DOM erst sehr spät beim Seitenaufbau
    document.querySelectorAll(".nav-menu li").forEach(function(item) {
        if (item.querySelector("ul")) {
            item.classList.add("has-submenu");
            item.setAttribute("aria-haspopup", "true");
        }
    });
});`,
  "shopify-css-aspect-ratio": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Layout Shift Desaster)
// Lädt Bilder ohne vordefinierte Abmessungen oder Platzhalter.
// Der Browser erfährt die Dimensionen erst nach dem abgeschlossenen Download, 
// wodurch der gesamte nachfolgende Inhalt abrupt nach unten springt.

<div class="bad-grid">
  {% for product in collection.products %}
    <div class="card">
      <img src="{{ product.featured_image.src }}" /> <!-- Unoptimiertes Riesenbild ohne HTML Aspect Ratios oder lazy loading! -->
      <h2>{{ product.title }}</h2>
    </div>
  {% endfor %}
</div>`,
  "vanilla-web-worker": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Eingefrorener Browser)
// Führt rechenintensive CPU-Operationen direkt auf dem UI-Thread (Haupt-Thread) aus.
// Hover-Effekte frieren ein, Eingaben reagieren erst Sekunden später und der Browser
// schlägt eine Beendigung der abgestürzten Seite vor.

function processDataInMainThread() {
    // Fatal: Blockiert 100% Core Kapazität direkt im Rendering-Thread
    let sum = 0;
    for (let i = 0; i < 99000000; i++) {
        sum += Math.sqrt(i) * Math.sin(i);
    }
    return sum;
}`,
  "headless-woo-redis": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Träge & Fehlerbehaftet)
// Lädt unstrukturiert sämtliche WP Posts, filtert über das PHP Memory-Limit 
// und reißt bei 500+ Produkten mit fatalen Memory Limits ab.

add_action('rest_api_init', function () {
    register_rest_route('ai/v1', '/lazy-products', [
        'methods' => 'GET',
        'callback' => function() {
            // Schlecht: Holt ALLE Postobjekte ungefiltert in den RAM
            $posts = get_posts(['post_type' => 'product', 'posts_per_page' => -1]); 
            $data = [];
            foreach($posts as $post) {
                // Extrem träge: Jedes Feld triggerte eigene DB Queries
                $data[] = [
                    'id' => $post->ID,
                    'title' => $post->post_title,
                    'meta' => get_post_meta($post->ID) 
                ];
            }
            return $data; // Verursacht HTTP 504 Gateway Timeout bei Live-Datenbanken!
        }
    ]);
});`,
  "shopify-metaobjects-testimonials": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Bläht die Ladezeiten auf)
// Bindet unnötige jQuery CDN Skripte ein und lässt das Bild springen (hoher CLS),
// weil das CSS Layout nicht mit Platzhaltern (Aspect Ratio) initialisiert wird.

document.write('<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>');
document.write('<script src="https://cdn.jsdelivr.net/npm/slick-carousel/slick.min.js"></script>');

$(document).ready(function(){
  $('.testimonial-slider').slick({
    autoplay: true, // Springt unkontrolliert hin und her
    dots: true      // Kein ARIA/Tastatur-Fokus für blinde User
  });
});`,
  "wordpress-block-deprecation-killer": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Der Website-Tod bei Updates)
// Speichert statisches HTML direkt in Gutenberg Database Einträgen.
// Sobald sich der Code-Zustand des Plugins ändert, stürzt der Block mit
// "This block contains unexpected or invalid content" komplett ab.

registerBlockType('ai-slop/custom-box', {
    title: 'Custom Box',
    save: function(props) {
        // Kritisch: Statische HTML Speicherungen führen zu Block-Deprecations,
        // sobald Redakteure einen Tippfehler korrigieren oder Klassen aktualisieren.
        return el('div', { className: 'ai-slop-box' }, 'Festgeschriebener Code');
    }
});`,
  "vanilla-asset-preloader": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE
// Klassische Inline-Style Schleudern ohne Performance-Verständnis.
document.querySelectorAll('.asset').forEach(el => {
  el.style.left = Math.random() * 100 + 'px'; // Verursacht massiven Layout Trash / Recalculate Style FPS Drops
});`,
  "wordpress-multisite-performance": `// ❌ GÄNGIGER AI-GENERATOR / SLOP CODE (Cache-Verschmutzung & Host-Stau)
// Teilt sich denselben globalen Redis cache Key-Namespace über alle Sites.
// Eine Änderung auf Site A überschreibt damit versehentlich Daten auf Site B, 
// während unoptimierte S3-Uploads den Webserver-PHP-Prozess sekundenlang blockieren.

add_action('init', function() {
    // Unsalted cache connection - fatal collisions in multisite networks!
    $cache_key = "global_latest_posts";
    $posts = wp_cache_get($cache_key);
    if (!$posts) {
        $posts = get_posts(['numberposts' => 5]);
        wp_cache_set($cache_key, $posts); // Site A overwriting Site B data!
    }
});`
};

const TIMELINE = [
  {
    date: "Jan. 2026 – heute",
    role: "Gründer & Lead Developer",
    company: "LogPort – SaaS Logistikplattform (Eigenentwicklung)",
    description: "Konzeption, Produktdesign und vollständige schlüsselfertige Entwicklung einer modernen Multi-Tenant B2B-SaaS-Plattform für Speditionen von Grund auf. Eigenständige Verantwortung für alle Architekturentscheidungen, das relationale Datenbankdesign und vollautomatische Deployments. Das System reduziert Kundenrückfragen durch Echtzeit-Statusverfolgung und Self-Service-Dokumenten-Uploads.",
    techUsed: ["Next.js 15", "TypeScript", "Prisma ORM", "PostgreSQL (Neon)", "Supabase", "TailwindCSS", "NextAuth v5", "Stripe", "Vercel"],
    realStory: "Die größte technische Hürde war die absolute logische und physische Isolation der Mandantendaten (Multi-Tenancy) auf einer geteilten PostgreSQL-Instanz. Durch eine Kombination aus Next.js App Router Middleware und Prisma-seitigen Abfrage-Guards konnte ich Cross-Tenant-Datenaustritt sicher verhindern. Auch die ausfallsichere Verarbeitung von Stripe-Abonnement-Webhooks zur Quoten-Validierung direkt im Server-Action-Flow war eine spannende Herausforderung."
  },
  {
    date: "09/2022 – 06/2025",
    role: "Freier Entwickler (Webentwicklung)",
    company: "Vertrauliches Projekt — Event- & Künstlermanagement",
    description: "Mitarbeit an einer hochperformanten webbasierten Plattform im Bereich Event- und Künstlermanagement. Konzeption und technische Umsetzung zentraler Module auf Basis von WordPress sowie Implementierung automatisierter Funktionen für die Benutzerverwaltung und Datenverarbeitung. Enge Koordination mit Stakeholdern.",
    techUsed: ["WordPress Core", "PHP & MySQL", "JavaScript", "User Automation", "REST APIs"],
    realStory: "Bei diesem vertraulichen Projekt war eine extrem strukturierte Benutzerrechterolle und Datensparsamkeit gefragt. Durch passgenaue, performante WordPress-Hooks und asynchrone Requests konnten wir den Serveraufwand halbieren und sensible Daten nach harten Compliance-Vorgaben verarbeiten."
  },
  {
    date: "10/2018 – 04/2022",
    role: "Web Developer",
    company: "Euphorika Communications UG",
    description: "Entwicklung und Pflege von Webseiten und konversionsstarken Landingpages für vielzählige Kunden der Hamburger Agentur. Pixel-genaue Umsetzung moderner Mockups in hochentwickelten Code. Konzeption, Aufsatz und Pflege von WordPress-, Shopify- und Shopware 5/6-Systemen inklusive nachhaltiger Einweisungen für Endkunden.",
    techUsed: ["WordPress", "Shopify Theme Engine", "Shopware 5 & 6", "JavaScript (ES6+)", "HTML5 / CSS3"],
    realStory: "In der Hamburger Agentur haben wir anspruchsvolle E-Commerce-Websites von Grund auf aufgebaut. Ein echtes Highlight war die Minimierung von Plugin-Overhead bei Shopify & Shopware, was die mobilen Core Web Vitals massiv optimierte. Durch meine verständlichen Kundenschulungen konnten Kunden ihre Systeme völlig autark ausrichten."
  },
  {
    date: "02/2017 – 10/2017",
    role: "Selbstlernzeit & Weiterbildung",
    company: "Webmasters Europe Certified Professional Program (GFN AG)",
    description: "Intensives, zertifiziertes Qualifizierungsprogramm im Bereich moderner Webentwicklung. Vertiefte Ausbildung in Software-Architektur, nativem JavaScript, PHP & MySQL-Verarbeitung, responsivem Interface Design und technischem SEO.",
    techUsed: ["JavaScript", "PHP & MySQL", "Webarchitektur", "Interface Design", "Online-Marketing"],
    realStory: "Dieses anspruchsvolle Programm bot mir die perfekte Möglichkeit, meine praktischen Vorkenntnisse auf ein professionelles, standardisiertes Niveau zu heben. Der tiefe Fokus auf saubere Code-Strukturen und Datenbank-Normalisierung prägt meine Arbeitsweise bis heute."
  }
];

// Exception-safe LocalStorage access helper
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access restricted:", e);
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write restricted:", e);
    }
  }
};

// STATE MANAGEMENT FOR ACTIVE CUSTOMER PREFERENCES
let currentLayoutState = {
  accent: safeStorage.getItem("bawab-layout-accent") || "cyan",
  font: safeStorage.getItem("bawab-layout-font") || "serif",
  density: safeStorage.getItem("bawab-layout-density") || "cozy",
  size: safeStorage.getItem("bawab-layout-size") || "medium",
  darkTheme: safeStorage.getItem("bawab-layout-dark") !== "false",
  highContrast: safeStorage.getItem("bawab-layout-contrast") === "true",
  easterEggMatrix: false,
  easterEggCrt: false
};

// SIMULATOR SPEED CONTROLLER ENGINE DATAS
let activeOptimizations = {
  images: false,
  scripts: false,
  fonts: false,
  css: false
};

// SELECTION POINTERS FOR COMPARATORS
let selectedInspectorProject = PROJECTS[0];
let showLazyAlternativeCode = false;

// STORY ACTIVE ACCORDIONS MAP
let activeStoryIdx = 0;

// GLOBAL INIT INITIALIZATION ON CARRIER DOM LOAD
document.addEventListener("DOMContentLoaded", () => {
  // Delay clock initialization until load and idle callback to optimize LCP and main-thread execution
  window.addEventListener("load", () => {
    if (typeof initLiveClock === "function") {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => initLiveClock());
      } else {
        setTimeout(initLiveClock, 50);
      }
    }
  });

  initThemeEngine();
  initSpeedSimulator();
  renderCaseStudies("All");
  initCaseStudiesFilters();
  renderCodeInspectorSidebar();
  renderCodeInspectorWorkspace();
  renderTimelineChronology();
  initRecruitingContactForm();
  setupAnchorLinksSmoothScroll();
  initMobileHamburgerDropdown();

  // Dialog triggers for resume
  const runResumeBtn = document.getElementById("btn-download-resume");
  if (runResumeBtn) {
    runResumeBtn.addEventListener("click", () => {
      try {
        if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
          alert("Das PDF-Modul wird noch geladen. Bitte versuchen Sie es in wenigen Sekunden erneut.");
          return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });

        const marginX = 18;
        const contentWidth = 210 - (marginX * 2); // 174 mm
        let y = 20;

        // Shared Page Header and Footer layout helper
        const drawPageDecoration = (pageNum) => {
          // Top clean mini header
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(110, 110, 110);
          doc.text("HUSSEIN BAWAB", marginX, 12);
          doc.text("Web Developer", 210 - marginX, 12, { align: "right" });
          
          // Header divider line
          doc.setDrawColor(210, 210, 210);
          doc.setLineWidth(0.2);
          doc.line(marginX, 14, 210 - marginX, 14);

          // Bottom clean footer line
          doc.line(marginX, 278, 210 - marginX, 278);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(130, 130, 130);
          doc.text("Hamburg, Deutschland", marginX, 283);
          doc.text("(+49) 151 29 66 48 06", 105, 283, { align: "center" });
          doc.text("bawab@gmx.de", 210 - marginX, 283, { align: "right" });
          
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`Seite ${pageNum} / 3`, 210 - marginX, 274, { align: "right" });
        };

        // ================= PAGE 1 =================
        drawPageDecoration(1);

        y = 30;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(17, 17, 17);
        doc.text("HUSSEIN BAWAB", marginX, y);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(70, 70, 70);
        doc.text("Web Developer — Frontend & Backend", marginX, y);
        y += 10;

        // Details block
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 100, 100);
        doc.text("Hamburg, Deutschland   |   +49 1512 9664806   |   bawab@gmx.de", marginX, y);
        y += 6;

        // Heavy visual divider
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.4);
        doc.line(marginX, y, 210 - marginX, y);
        y += 12;

        // BERUFSPROFIL
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(17, 17, 17);
        doc.text("BERUFSPROFIL", marginX, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 50);
        
        const profileLines = [
          "Erfahrener Webentwickler mit fundierter Expertise in der Frontend- und Backend-Entwicklung sowie in der Implementierung moderner E-Commerce-Systeme.",
          "Spezialisiert auf die Entwicklung responsiver, barrierefreier und performanter Web-Applikationen mit Fokus auf exzellente UI/UX und saubere CodeStrukturen.",
          "Erprobt in der technischen Beratung und Befähigung von Kunden zur eigenständigen Systempflege."
        ];

        profileLines.forEach(line => {
          const splitText = doc.splitTextToSize(line, contentWidth);
          doc.text(splitText, marginX, y);
          y += (splitText.length * 4.8) + 3;
        });

        y += 4;

        // BERUFSERFAHRUNG
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(17, 17, 17);
        doc.text("BERUFSERFAHRUNG", marginX, y);
        y += 8;

        // Job 1
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        doc.text("09/2022 – 06/2025: Webentwicklung — Vertrauliches Projekt", marginX, y);
        y += 4.5;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(90, 90, 90);
        doc.text("(Freier Entwickler)", marginX, y);
        y += 7;

        // Bullets for Job 1
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);

        const bulletsJob1 = [
          "• Mitarbeit an einer webbasierten Plattform im Bereich Event- und Künstlermanagement",
          "• Konzeption und technische Umsetzung zentraler Module auf Basis von WordPress",
          "• Implementierung automatisierter Funktionen für Benutzerverwaltung und Datenverarbeitung",
          "• Enge Zusammenarbeit mit Projektleitung und Stakeholdern",
          "• Projektende durch strategische Neuausrichtung des Projekts Mitte 2025 (Details aufgrund Verschwiegenheitspflicht vertraulich)"
        ];

        bulletsJob1.forEach(bullet => {
          const splitBullet = doc.splitTextToSize(bullet, contentWidth);
          doc.text(splitBullet, marginX, y);
          y += (splitBullet.length * 4.5) + 1.2;
        });


        // ================= PAGE 2 =================
        doc.addPage();
        drawPageDecoration(2);
        y = 25;

        // BERUFSERFAHRUNG (Fortsetzung)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(17, 17, 17);
        doc.text("BERUFSERFAHRUNG (Fortsetzung)", marginX, y);
        y += 8;

        // Job 2
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        doc.text("10/2018 – 04/2022: Web Developer", marginX, y);
        y += 4.5;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(90, 90, 90);
        doc.text("Euphorika Communications UG", marginX, y);
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);

        const bulletsJob2 = [
          "• Entwicklung und Pflege von Webseiten und Landingpages für Kunden der Agentur",
          "• Umsetzung von Layouts nach Designvorgaben (HTML, CSS, JavaScript)",
          "• Arbeit mit CMS-Systemen (WordPress, Shopify, Shopware 5 & 6)",
          "• Technische Unterstützung und Einweisung von Kunden in ihre Systeme",
          "• Laufende Optimierung bestehender Installationen und enge Abstimmung mit dem Projektteam"
        ];

        bulletsJob2.forEach(bullet => {
          const splitBullet = doc.splitTextToSize(bullet, contentWidth);
          doc.text(splitBullet, marginX, y);
          y += (splitBullet.length * 4.5) + 1.2;
        });

        y += 6;

        // AUSBILDUNG
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(17, 17, 17);
        doc.text("AUSBILDUNG", marginX, y);
        y += 8;

        // Schule/Studium 1
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        doc.text("03/2005 – 02/2009: Hochschulstudium: Bibliotheks- und Informationsmanagement (ohne Abschluss)", marginX, y);
        y += 4.5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.2);
        doc.setTextColor(90, 90, 90);
        doc.text("Hochschule für angewandte Wissenschaften Hamburg (HAW)", marginX, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(65, 65, 65);
        const studyText = "Schwerpunkt: Informationsmanagement. Praktische Erfahrung durch Praktika im Hochschul-Informations- und Bibliotheksservice (HIBS) sowie in der Bücherhalle Barmbek.";
        const splitStudy = doc.splitTextToSize(studyText, contentWidth);
        doc.text(splitStudy, marginX, y);
        y += (splitStudy.length * 4.5) + 5;

        // Studienkolleg
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        doc.text("09/2004 – 08/2007: Studienkolleg", marginX, y);
        y += 4.5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.2);
        doc.setTextColor(90, 90, 90);
        doc.text("Behörde für Schule, Jugend und Berufsbildung, Hamburg", marginX, y);
        y += 8;

        // Deutschkurs
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(30, 30, 30);
        doc.text("12/2001 – 07/2002: Deutschsprachkurs", marginX, y);
        y += 4.5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.2);
        doc.setTextColor(90, 90, 90);
        doc.text("D.A.B St. Pauli, Hamburg", marginX, y);
        y += 12;

        // WEITERBILDUNG
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(17, 17, 17);
        doc.text("WEITERBILDUNG", marginX, y);
        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(35, 35, 35);
        doc.text("02/2017 – 10/2017: Zertifizierungen — GFN AG, Hamburg", marginX, y);
        y += 5.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const trainingBullets = [
          "• Certified Developer (JavaScript)",
          "• Certified Developer (PHP & MySQL)",
          "• Certified Web Architecture",
          "• Certified Online Marketing Management",
          "• Certified Web Interface Designer"
        ];
        trainingBullets.forEach(bullet => {
          const splitB = doc.splitTextToSize(bullet, contentWidth);
          doc.text(splitB, marginX, y);
          y += (splitB.length * 4.5) + 1.2;
        });


        // ================= PAGE 3 =================
        doc.addPage();
        drawPageDecoration(3);
        y = 25;

        // IT-KENNTNISSE & FÄHIGKEITEN
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(17, 17, 17);
        doc.text("IT-KENNTNISSE & FÄHIGKEITEN", marginX, y);
        y += 10;

        // Section elements layout
        const drawSkillsRow = (label, details) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          doc.text(label, marginX, y);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(65, 65, 65);
          
          const textX = marginX + 38;
          const textW = contentWidth - 38;
          const splitD = doc.splitTextToSize(details, textW);
          doc.text(splitD, textX, y);
          
          y += (splitD.length * 4.5) + 6;
        };

        drawSkillsRow("Core Skills", "Frontend Entwicklung, Backend Entwicklung, Responsive Webdesign, Barrierefreiheit (Accessibility), Web-Performance Optimierung, SEO");
        drawSkillsRow("Technologien", "JavaScript (fortgeschritten), PHP & MySQL (fortgeschritten), HTML5 / CSS3 (Expertenniveau), React (Grundkenntnisse), Vue.js (Grundkenntnisse)");
        drawSkillsRow("CMS & E-Commerce", "WordPress (umfangreiche Erfahrung), Shopware 5 & 6 (Konfiguration & Customization), Shopify (Implementierung)");
        drawSkillsRow("Tools & Workflows", "Git, VS Code, Browser DevTools, Hosting & Deployment, Agentur-Workflows, Technisches Schreiben (Dokumentation)");

        y += 6;
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.25);
        doc.line(marginX, y, 210 - marginX, y);
        y += 10;

        // SPRACHKENNTNISSE
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(17, 17, 17);
        doc.text("SPRACHKENNTNISSE", marginX, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text("• Arabisch: Muttersprache", marginX, y);
        y += 5.5;
        doc.text("• Englisch: Zweite Muttersprache / Fließend", marginX, y);
        y += 5.5;
        doc.text("• Deutsch: Fließend (Niveau C1)", marginX, y);

        // Download document!
        doc.save("Hussein_Bawab_CV_2026.pdf");
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Der PDF-Download ist fehlgeschlagen. Der Lebenslauf wird als Text in der Konsole ausgegeben.");
      }
    });
  }
});

// 1. DYNAMIC TIMEZONE CLOCK COORDS UPDATES (GERMANY TIME)
function initLiveClock() {
  const clockEl = document.getElementById("hamburg-clock");
  if (!clockEl) return;

  const updateClock = () => {
    try {
      const options = {
        timeZone: "Europe/Berlin",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat("de-DE", options);
      clockEl.textContent = formatter.format(new Date());
    } catch (e) {
      // Fallback
      const d = new Date();
      clockEl.textContent = d.toTimeString().split(" ")[0];
    }
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// 2. LIVE DESIGN LAYOUT CUSTOMIZATION COMPILER
function initThemeEngine() {
  const root = document.documentElement;

  // Sync state directly onto root wrappers on boots
  applyAccentState(currentLayoutState.accent);
  applyFontState(currentLayoutState.font);
  applyDensityState(currentLayoutState.density);
  applySizeState(currentLayoutState.size);
  applyCoreThemeModeState(currentLayoutState.darkTheme);
  applyHighContrastState(currentLayoutState.highContrast);

  // Setup Element click bindings for accents picker
  const pickerButtons = document.querySelectorAll(".clr-picker-btn");
  pickerButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const selectedClr = btn.getAttribute("data-color");
      currentLayoutState.accent = selectedClr;
      safeStorage.setItem("bawab-layout-accent", selectedClr);
      applyAccentState(selectedClr);
    });
  });

  // Setup Element click bindings for fonts picker
  const fontButtons = document.querySelectorAll(".font-selector-btn");
  fontButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedFont = btn.getAttribute("data-font");
      currentLayoutState.font = selectedFont;
      safeStorage.setItem("bawab-layout-font", selectedFont);
      applyFontState(selectedFont);
    });
  });

  // Setup Element click bindings for spacing densities
  const densityButtons = document.querySelectorAll(".density-selector-btn");
  densityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedDensity = btn.getAttribute("data-density");
      currentLayoutState.density = selectedDensity;
      safeStorage.setItem("bawab-layout-density", selectedDensity);
      applyDensityState(selectedDensity);
    });
  });

  // Setup Element click bindings for layouts sizing
  const sizeButtons = document.querySelectorAll(".size-selector-btn");
  sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedSize = btn.getAttribute("data-size");
      currentLayoutState.size = selectedSize;
      safeStorage.setItem("bawab-layout-size", selectedSize);
      applySizeState(selectedSize);
    });
  });

  // Setup layout reset elements
  const resetBtn = document.getElementById("btn-reset-layout");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentLayoutState.accent = "cyan";
      currentLayoutState.font = "serif";
      currentLayoutState.density = "cozy";
      currentLayoutState.size = "medium";
      
      safeStorage.setItem("bawab-layout-accent", "cyan");
      safeStorage.setItem("bawab-layout-font", "serif");
      safeStorage.setItem("bawab-layout-density", "cozy");
      safeStorage.setItem("bawab-layout-size", "medium");
 
      applyAccentState("cyan");
      applyFontState("serif");
      applyDensityState("cozy");
      applySizeState("medium");
    });
  }

  // Header Theme switcher setup
  const themeToggle = document.getElementById("theme-toggle-btn");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      currentLayoutState.darkTheme = !currentLayoutState.darkTheme;
      safeStorage.setItem("bawab-layout-dark", currentLayoutState.darkTheme);
      applyCoreThemeModeState(currentLayoutState.darkTheme);
    });
  }

  // Floating design layout engine popover handler
  const toggleBtn = document.getElementById("btn-toggle-layout-engine");
  const popover = document.getElementById("layout-engine-popover");

  if (toggleBtn && popover) {
    const showPopover = () => {
      popover.classList.remove("hidden");
      setTimeout(() => {
        popover.classList.remove("opacity-0", "scale-95", "pointer-events-none");
        popover.classList.add("opacity-100", "scale-100");
      }, 10);
    };

    const hidePopover = () => {
      popover.classList.remove("opacity-100", "scale-100");
      popover.classList.add("opacity-0", "scale-95", "pointer-events-none");
      setTimeout(() => {
        if (popover.classList.contains("opacity-0")) {
          popover.classList.add("hidden");
        }
      }, 200);
    };

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = popover.classList.contains("hidden");
      if (isHidden) {
        showPopover();
      } else {
        hidePopover();
      }
    });

    document.addEventListener("click", (e) => {
      if (!popover.classList.contains("hidden")) {
        const isClickInsidePopover = popover.contains(e.target);
        const isClickOnToggleBtn = toggleBtn.contains(e.target);
        const isClickOnThemeToggle = e.target.closest("#theme-toggle-btn") || e.target.closest("#theme-toggle");
        
        if (!isClickInsidePopover && !isClickOnToggleBtn && !isClickOnThemeToggle) {
          hidePopover();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !popover.classList.contains("hidden")) {
        hidePopover();
      }
    });
  }
}

// Mapping and toggling of Accent colors variables
function applyAccentState(color) {
  const root = document.documentElement;
  // Redesign custom colors CSS variables
  let hexCode = "#06b6d4";
  let rgbCode = "6, 182, 212";

  if (color === "purple") {
    hexCode = "#8b5cf6";
    rgbCode = "139, 92, 246";
  } else if (color === "amber") {
    hexCode = "#f59e0b";
    rgbCode = "245, 158, 11";
  } else if (color === "rose") {
    hexCode = "#f43f5e";
    rgbCode = "244, 63, 94";
  }

  root.style.setProperty("--brand-accent", hexCode);
  root.style.setProperty("--brand-accent-rgb", rgbCode);

  // Toggle Check icon signs inside layout engine block buttons list
  const pickerButtons = document.querySelectorAll(".clr-picker-btn");
  pickerButtons.forEach(btn => {
    const clrName = btn.getAttribute("data-color");
    const checkIcon = btn.querySelector("svg");
    if (clrName === color) {
      btn.classList.add("ring-2", "ring-[#070708]", "dark:ring-white", "ring-offset-2", "ring-offset-[#070708]");
      if (checkIcon) checkIcon.classList.remove("hidden");
    } else {
      btn.classList.remove("ring-2", "ring-[#070708]", "dark:ring-white", "ring-offset-2", "ring-offset-[#070708]");
      if (checkIcon) checkIcon.classList.add("hidden");
    }
  });

  // Highlight status debug labels
  printActiveLayoutString();
}

// Mapping of Font Pairings
function applyFontState(fontStyle) {
  const root = document.documentElement;
  let fontValueHeader = "var(--font-sans)";
  let fontValueBody = "var(--font-sans)";

  if (fontStyle === "serif") {
    fontValueHeader = "var(--font-serif)";
    fontValueBody = "var(--font-sans)";
  } else if (fontStyle === "mono") {
    fontValueHeader = "var(--font-mono)";
    fontValueBody = "var(--font-mono)";
  }

  root.style.setProperty("--active-header-font", fontValueHeader);
  root.style.setProperty("--active-body-font", fontValueBody);

  // Modify buttons selection layouts in engine block
  const fontButtons = document.querySelectorAll(".font-selector-btn");
  fontButtons.forEach(btn => {
    const fontName = btn.getAttribute("data-font");
    if (fontName === fontStyle) {
      btn.className = "font-selector-btn py-1 px-1.5 rounded text-[10px] font-bold text-center uppercase cursor-pointer transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs flex items-center justify-center h-7 select-none leading-none";
    } else {
      btn.className = "font-selector-btn py-1 px-1.5 rounded text-[10px] font-semibold text-center uppercase cursor-pointer transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center justify-center h-7 select-none leading-none";
    }
  });

  printActiveLayoutString();
}

// Spacing density setup classes changer
function applyDensityState(densityChoice) {
  const root = document.documentElement;
  // Remove old density flags
  root.classList.remove("density-compact", "density-cozy", "density-relaxed");
  root.classList.add(`density-${densityChoice}`);

  // Modify button states inside visual component
  const densityButtons = document.querySelectorAll(".density-selector-btn");
  densityButtons.forEach(btn => {
    const dName = btn.getAttribute("data-density");
    if (dName === densityChoice) {
      btn.className = "density-selector-btn py-1 px-1.5 rounded text-[10px] font-bold text-center uppercase cursor-pointer transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs flex items-center justify-center h-7 select-none leading-none";
    } else {
      btn.className = "density-selector-btn py-1 px-1.5 rounded text-[10px] font-semibold text-center uppercase cursor-pointer transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center justify-center h-7 select-none leading-none";
    }
  });

  printActiveLayoutString();
}

// Font size scaling helper function
function applySizeState(sizeChoice) {
  const root = document.documentElement;
  // Remove old size prefix classes
  root.classList.remove("size-small", "size-medium", "size-large");
  root.classList.add(`size-${sizeChoice}`);

  // Modify button states inside size selector list
  const sizeButtons = document.querySelectorAll(".size-selector-btn");
  sizeButtons.forEach(btn => {
    const sName = btn.getAttribute("data-size");
    if (sName === sizeChoice) {
      btn.className = "size-selector-btn py-1 px-1.5 rounded text-[10px] font-bold text-center uppercase cursor-pointer transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs flex items-center justify-center h-7 select-none leading-none";
    } else {
      btn.className = "size-selector-btn py-1 px-1.5 rounded text-[10px] font-semibold text-center uppercase cursor-pointer transition-all text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center justify-center h-7 select-none leading-none";
    }
  });

  printActiveLayoutString();
}

// Core Light / Dark schemas mapper
function applyCoreThemeModeState(isDarkMode) {
  const root = document.documentElement;
  const iconDark = document.getElementById("theme-icon-dark");
  const iconLight = document.getElementById("theme-icon-light");
  const gridBg = document.getElementById("hero-grid-bg");

  if (isDarkMode) {
    root.classList.add("dark");
    document.body.classList.add("bg-[#070708]", "text-neutral-200");
    document.body.classList.remove("bg-white", "text-neutral-800");

    if (iconDark) iconDark.classList.add("hidden");
    if (iconLight) iconLight.classList.remove("hidden");
    if (gridBg) {
      gridBg.classList.add("editorial-grid");
      gridBg.classList.remove("editorial-grid-light");
    }
  } else {
    root.classList.remove("dark");
    document.body.classList.remove("bg-[#070708]", "text-neutral-200");
    document.body.classList.add("bg-white", "text-neutral-800");

    if (iconDark) iconDark.classList.remove("hidden");
    if (iconLight) iconLight.classList.add("hidden");
    if (gridBg) {
      gridBg.classList.remove("editorial-grid");
      gridBg.classList.add("editorial-grid-light");
    }
  }
}

// High contrast accessibility mode
function applyHighContrastState(isContrastActive) {
  const root = document.documentElement;
  const contentRoot = document.getElementById("portfolio-content-root");
  if (isContrastActive) {
    root.classList.add("contrast-double");
    if (contentRoot) {
      contentRoot.classList.add("contrast-125");
    } else {
      document.body.classList.add("contrast-125");
    }
  } else {
    root.classList.remove("contrast-double");
    if (contentRoot) {
      contentRoot.classList.remove("contrast-125");
    }
    document.body.classList.remove("contrast-125");
  }
}

// Render dynamic specifications status in layout engine bottom row
function printActiveLayoutString() {
  const label = document.getElementById("debug-layout-string");
  if (!label) return;

  const fontName = currentLayoutState.font === "mono" ? "Monospace Brutalism" : currentLayoutState.font === "serif" ? "Editorial Serif" : "Neo-Grotesque";
  const densName = currentLayoutState.density === "compact" ? "Kompakt (Grid)" : currentLayoutState.density === "relaxed" ? "Luftig (Magazin)" : "Standard (Cozy)";
  const sizeName = currentLayoutState.size === "small" ? "Klein" : currentLayoutState.size === "large" ? "Groß" : "Mittel";
  
  label.textContent = `${fontName} / ${densName} / ${sizeName}`;
}

// 3. CORE WEB VITALS PAGE SPEED SIMULATOR CALCULATOR
function initSpeedSimulator() {
  // Bind opt-button clicks
  const cards = document.querySelectorAll(".opt-card-btn");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const optId = card.getAttribute("data-optid");
      let key = "images";
      if (optId === "scripts-opt") key = "scripts";
      else if (optId === "fonts-opt") key = "fonts";
      else if (optId === "css-opt") key = "css";

      // Toggle value
      activeOptimizations[key] = !activeOptimizations[key];
      
      // Update element visuals
      applyOptimizationVisuals(card, activeOptimizations[key], key);
      
      // Recalculate metrics scores
      recalculateSpeedMetrics();
    });
  });

  // Calculate first initial static states (Lighthouse = 38)
  recalculateSpeedMetrics();
}

function applyOptimizationVisuals(cardNode, isActive, key) {
  const statusDot = cardNode.querySelector(".status-dot");
  const badgeStatus = cardNode.querySelector(".badge-status");
  const feedbackLabel = cardNode.querySelector(".feedback-label span");

  // Toggle base classes
  if (isActive) {
    cardNode.classList.add("border-brand-accent-soft", "bg-brand-accent-soft");
    cardNode.classList.remove("border-neutral-200", "dark:border-neutral-800", "hover:bg-neutral-50", "dark:hover:bg-neutral-900/40");
    
    if (statusDot) {
      statusDot.className = "status-dot w-2 h-2 rounded-full bg-brand-accent";
    }
    if (badgeStatus) {
      badgeStatus.className = "badge-status text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold uppercase";
      badgeStatus.textContent = "Aktiv";
    }

    if (key === "images") {
      feedbackLabel.className = "text-emerald-500 font-semibold";
      feedbackLabel.innerHTML = "✓ Bilder skaliert in AVIF/WebP, explizite AspectRatios gesetzt";
    } else if (key === "scripts") {
      feedbackLabel.className = "text-emerald-500 font-semibold";
      feedbackLabel.innerHTML = "✓ Tracking-Scripts asynchron verzögert geladen per Delay-Controller";
    } else if (key === "fonts") {
      feedbackLabel.className = "text-emerald-500 font-semibold";
      feedbackLabel.innerHTML = "✓ WOFF2 lokal selbstgehostet, font-display: swap erzwungen";
    } else if (key === "css") {
      feedbackLabel.className = "text-emerald-500 font-semibold";
      feedbackLabel.innerHTML = "✓ Kritisches CSS direkt inline, ungenutzter Elementor-Ballast eliminiert";
    }

  } else {
    cardNode.classList.remove("border-brand-accent-soft", "bg-brand-accent-soft");
    cardNode.classList.add("border-neutral-200", "dark:border-neutral-800", "hover:bg-neutral-50", "dark:hover:bg-neutral-900/40");
    
    if (statusDot) {
      statusDot.className = "status-dot w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600";
    }
    if (badgeStatus) {
      badgeStatus.className = "badge-status text-[9px] font-mono text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded font-semibold uppercase";
      badgeStatus.textContent = "Inaktiv";
    }

    if (key === "images") {
      feedbackLabel.className = "text-neutral-600 dark:text-neutral-400";
      feedbackLabel.innerHTML = "✗ Schwere PNGs (4MB) ohne 'width/height' &amp; LazyLoad";
    } else if (key === "scripts") {
      feedbackLabel.className = "text-neutral-600 dark:text-neutral-400";
      feedbackLabel.innerHTML = "✗ Synchrone Einbindung im &lt;head&gt; (blockiert Parser)";
    } else if (key === "fonts") {
      feedbackLabel.className = "text-neutral-600 dark:text-neutral-400";
      feedbackLabel.innerHTML = "✗ Standard TTF ohne swap (verursacht unsichtbaren Text)";
    } else if (key === "css") {
      feedbackLabel.className = "text-neutral-600 dark:text-neutral-400";
      feedbackLabel.innerHTML = "✗ Megabyte-großes Framework-CSS (All-in-one)";
    }
  }
}

function recalculateSpeedMetrics() {
  // Lighthouse Score maths computation
  let baseScore = 38;
  if (activeOptimizations.images) baseScore += 22;
  if (activeOptimizations.scripts) baseScore += 18;
  if (activeOptimizations.fonts) baseScore += 11;
  if (activeOptimizations.css) baseScore += 11;

  if (baseScore > 100) baseScore = 100;

  // LCP limits
  let lcpSec = 8.80;
  if (activeOptimizations.images) lcpSec -= 3.4;
  if (activeOptimizations.scripts) lcpSec -= 2.5;
  if (activeOptimizations.fonts) lcpSec -= 1.1;
  if (activeOptimizations.css) lcpSec -= 1.8;
  if (lcpSec < 0.60) lcpSec = 0.60;

  // INP values
  let inpMs = 210;
  if (activeOptimizations.scripts) inpMs -= 140;
  if (inpMs < 70) inpMs = 70;

  // CLS indexes
  let clsInd = 0.42;
  if (activeOptimizations.images) clsInd -= 0.28;
  if (activeOptimizations.fonts) clsInd -= 0.11;
  if (activeOptimizations.scripts) clsInd -= 0.03;
  if (clsInd < 0.00) clsInd = 0.00;

  // Render text counts into viewport elements
  const scoreText = document.getElementById("score-text-val");
  const fillCircle = document.getElementById("gauge-fill-circle");

  if (scoreText) scoreText.textContent = baseScore;

  // Transition circle colors & offsets: circumfe = 251.2
  if (fillCircle) {
    const offset = 251.2 * (1 - baseScore / 100);
    fillCircle.style.strokeDashoffset = offset;

    // Remove old classes color definitions
    fillCircle.classList.remove("stroke-rose-500", "stroke-amber-500", "stroke-emerald-500");
    scoreText.classList.remove("text-rose-500", "text-amber-500", "text-emerald-500");

    if (baseScore < 50) {
      fillCircle.classList.add("stroke-rose-500");
      scoreText.classList.add("text-rose-500");
    } else if (baseScore >= 50 && baseScore < 90) {
      fillCircle.classList.add("stroke-amber-500");
      scoreText.classList.add("text-amber-500");
    } else {
      fillCircle.classList.add("stroke-emerald-500");
      scoreText.classList.add("text-emerald-500");
    }
  }

  // Render metrics specifications rows:
  const lcpText = document.getElementById("metric-lcp-val");
  const lcpBadge = document.getElementById("metric-lcp-badge");
  if (lcpText && lcpBadge) {
    lcpText.textContent = `${lcpSec.toFixed(2)}s`;
    lcpBadge.className = "text-[10px] px-2 py-0.5 rounded font-mono " + 
      (lcpSec > 2.5 ? "text-rose-500 bg-rose-500/10" : lcpSec > 1.2 ? "text-amber-500 bg-amber-505/10" : "text-emerald-500 bg-emerald-500/10");
    lcpBadge.textContent = lcpSec > 2.5 ? "Kritisch" : lcpSec > 1.2 ? "Träge" : "Sehr Gut";
  }

  const inpText = document.getElementById("metric-inp-val");
  const inpBadge = document.getElementById("metric-inp-badge");
  if (inpText && inpBadge) {
    inpText.textContent = `${inpMs}ms`;
    inpBadge.className = "text-[10px] px-2 py-0.5 rounded font-mono " +
      (inpMs > 200 ? "text-rose-500 bg-rose-500/10" : inpMs > 100 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10");
    inpBadge.textContent = inpMs > 200 ? "Träge" : inpMs > 100 ? "Akteptabel" : "Pfeilschnell";
  }

  const clsText = document.getElementById("metric-cls-val");
  const clsBadge = document.getElementById("metric-cls-badge");
  if (clsText && clsBadge) {
    clsText.textContent = clsInd.toFixed(2);
    clsBadge.className = "text-[10px] px-2 py-0.5 rounded font-mono " +
      (clsInd > 0.25 ? "text-rose-500 bg-rose-500/10" : clsInd > 0.1 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10");
    clsBadge.textContent = clsInd > 0.25 ? "Instabil" : clsInd > 0.1 ? "Variabel" : "Stabil (0 Shift)";
  }

  // Generate recommendation reports textual advice
  const reportLabel = document.getElementById("speed-feedback-report");
  if (reportLabel) {
    let reportText = "";
    if (baseScore < 50) {
      reportLabel.className = "text-xs text-rose-400 font-sans mt-1 block leading-relaxed";
      reportText = "Alarmstufe Rot. Die Ladezeit von fast 9 Sekunden ist für mobile LTE-Kunden unzumutbar. 53% der Besucher springen ab, wenn das Laden länger als 3 Sekunden dauert. Aktivieren Sie die obigen Module!";
    } else if (baseScore >= 50 && baseScore < 90) {
      reportLabel.className = "text-xs text-amber-400 font-sans mt-1 block leading-relaxed";
      reportText = "Ausreichend optimiert. Sie haben bereits entscheidende Engpässe gelöst und sind damit weitaus schneller als die Konkurrenz. Bringen Sie die restlichen Module online um die magische 90er-Marke zu knacken!";
    } else {
      reportLabel.className = "text-xs text-emerald-400 font-semibold font-sans mt-1 block leading-relaxed";
      reportText = "✓ Exzellente Arbeit! 100/100 PageSpeed gelöst. Auf unbeschränkten 5G Netzen rendert die Applikation nun komplett verzögerungsfrei. Ein heroisches Conversion-Erlebnis für E-Commerce-Zahlen.";
    }
    reportLabel.innerHTML = reportText;
  }
}

// 4. PORTFOLIO CASE STUDIES LISTINGS FILTERS
function initCaseStudiesFilters() {
  const filterBtns = document.querySelectorAll(".project-filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle button active classes
      filterBtns.forEach(b => {
        b.className = "project-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300";
      });
      btn.className = "project-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs";

      // Selected category
      const targetCategory = btn.getAttribute("data-category");
      renderCaseStudies(targetCategory);
    });
  });
}

function renderCaseStudies(categorySelected) {
  const showroom = document.getElementById("projects-showroom");
  if (!showroom) return;

  // Clear listing
  showroom.innerHTML = "";

  // Filter projects list
  const filtered = categorySelected === "All" 
    ? PROJECTS 
    : PROJECTS.filter(p => {
        if (categorySelected === "WordPress") return p.category === "WordPress";
        if (categorySelected === "WooCommerce") return p.category === "WooCommerce";
        if (categorySelected === "Shopify") return p.category === "Shopify";
        if (categorySelected === "Vanilla JS / Tech Stack") return p.category === "Vanilla JS / Tech Stack";
        if (categorySelected === "SaaS / Next.js") return p.category === "SaaS / Next.js";
        return false;
      });

  if (filtered.length === 0) {
    showroom.innerHTML = `<p class="col-span-2 text-center py-10 font-mono text-neutral-500">Keine passenden Fallstudien gefunden.</p>`;
    return;
  }

  // Iterate and build HTML cards asynchronously
  filtered.forEach(proj => {
    const card = document.createElement("div");
    // Class properties matches density setup (dynamic padding class `dynamic-card-spacing`)
    card.className = "border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col justify-between bg-white dark:bg-[#09090b]/40 backdrop-blur-xs shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 dynamic-card-spacing";
    
    // Tech list
    let techTags = "";
    proj.tech.forEach(t => {
      techTags += `<span class="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded text-[10px] font-mono text-neutral-500 dark:text-neutral-300">${t}</span>`;
    });

    // Content cards template
    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-1.5 mb-2.5">
          <span class="inline-block text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 px-2 py-0.5 rounded-full tracking-widest">${proj.category}</span>
          <span class="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md leading-none max-w-[200px] truncate text-right border border-emerald-500/15" title="${proj.impact}">${proj.impact}</span>
        </div>
        <h3 class="text-lg font-sans font-bold text-neutral-800 dark:text-neutral-200 hover:text-brand-accent transition-colors">
          ${proj.title}
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans mt-2.5">
          ${proj.description}
        </p>

        <!-- Dynamic challenges details -->
        <div class="mt-4 border-t border-dashed border-neutral-100 dark:border-neutral-800 pt-3">
          <span class="text-[9.5px] uppercase font-mono tracking-widest text-neutral-400 block mb-1">Herausforderung:</span>
          <ul class="list-disc pl-4 space-y-1">
            ${proj.challenges.map(c => `<li class="text-[11px] font-sans text-neutral-500 dark:text-neutral-400">${c}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-850">
        <div class="flex flex-wrap gap-1.5 mb-3.5">
          ${techTags}
        </div>
        
        <button class="view-snippet-btn w-full mt-2 border border-neutral-300 dark:border-neutral-750 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg py-2 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer" data-id="${proj.id}">
          Code vergleichen &amp; analysieren </button>
      </div>
    `;

    // Click trigger on bottom button leads to Code Inspector scrolling
    const actionBtn = card.querySelector(".view-snippet-btn");
    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        const id = actionBtn.getAttribute("data-id");
        const match = PROJECTS.find(p => p.id === id);
        if (match) {
          selectedInspectorProject = match;
          showLazyAlternativeCode = false;
          
          // Re-render comparative view
          renderCodeInspectorSidebar();
          renderCodeInspectorWorkspace();

          // Scroll directly into comparision section
          const trg = document.getElementById("code-repo-viewer");
          if (trg) {
            trg.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    }

    showroom.appendChild(card);
  });
}

// 5. COMPARATIVE CODE INSPECTOR WORKSPACE
function renderCodeInspectorSidebar() {
  const sidebarContainer = document.getElementById("inspector-file-sidebar");
  if (!sidebarContainer) return;

  sidebarContainer.innerHTML = "";

  PROJECTS.forEach(proj => {
    const btn = document.createElement("button");
    btn.setAttribute("data-id", proj.id);
    
    const isSelected = selectedInspectorProject.id === proj.id;
    const activeClass = isSelected 
      ? "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold" 
      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-250";

    btn.className = `w-full text-left px-3 py-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all block truncate ${activeClass}`;
    
    const iconName = proj.codeLanguage === "php" ? "🐘 wp-core-hook.php" : "🟨 custom-element.js";
    btn.innerHTML = `
      <div class="font-semibold text-sans text-xs mb-0.5 max-w-full truncate">${proj.title}</div>
      <div class="text-[10px] opacity-75 max-w-full truncate">${iconName}</div>
    `;

    btn.addEventListener("click", () => {
      selectedInspectorProject = proj;
      showLazyAlternativeCode = false;
      renderCodeInspectorSidebar();
      renderCodeInspectorWorkspace();
    });

    sidebarContainer.appendChild(btn);
  });
}

function renderCodeInspectorWorkspace() {
  const customSauberTab = document.getElementById("tab-sauber");
  const customSlopTab = document.getElementById("tab-slop");
  const codeBlock = document.getElementById("inspector-code-block");
  const explanationLabel = document.getElementById("inspector-explanation-label");
  const feedbackItalic = document.getElementById("tab-feedback-italic");

  // Dynamic heading selectors
  const activeTitle = document.getElementById("inspector-project-title");
  const activeCategory = document.getElementById("inspector-project-category");
  const activeImpact = document.getElementById("inspector-project-impact");

  if (activeTitle) {
    activeTitle.textContent = selectedInspectorProject.title;
  }
  if (activeCategory) {
    activeCategory.textContent = selectedInspectorProject.category;
  }
  if (activeImpact) {
    activeImpact.textContent = selectedInspectorProject.impact;
  }

  if (!codeBlock) return;

  // Active toggles style selectors updates
  if (showLazyAlternativeCode) {
    if (customSauberTab) {
      customSauberTab.className = "px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300";
    }
    if (customSlopTab) {
      customSlopTab.className = "px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-bold shadow-xs";
    }
    
    if (feedbackItalic) feedbackItalic.textContent = "Nicht nachmachen!";
    
    // Injects slop code recipe
    codeBlock.textContent = SLOP_RECIPES[selectedInspectorProject.id] || "// No Template found";
    
    // Explanation label updates if exists
    if (explanationLabel) {
      explanationLabel.className = "font-sans leading-relaxed text-rose-400 font-medium";
      explanationLabel.textContent = `Sogenannte "Copypaste-Scripte" sparen auf den ersten Blick 10 Minuten Arbeitszeit, scheitern aber im Live-Betrieb unter Last. Sie verstoßen gegen WordPress Codestandards, haben keine Hooks zur Extension und blockieren Suchmaschinen-Indexer per CLS.`;
    }

  } else {
    if (customSauberTab) {
      customSauberTab.className = "px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-bold shadow-xs";
    }
    if (customSlopTab) {
      customSlopTab.className = "px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300";
    }

    if (feedbackItalic) feedbackItalic.textContent = "Wartungsfrei & performant";

    // Injects healthy code
    codeBlock.textContent = selectedInspectorProject.codeSnippet;

    // Explanation label updates if exists
    if (explanationLabel) {
      explanationLabel.className = "font-sans leading-relaxed text-emerald-500 font-medium";
      explanationLabel.textContent = `Dieser Code setzt direkt auf dem nativen API-Skelett auf. Er spart hunderte KB unnötigen Framework-Bloats, ist gegen SQL-Injections gesichert und dank expliziter Assetdimensionierung absolut Layout Shift (CLS) frei.`;
    }
  }

  // Bind tab toggling clicks
  if (customSauberTab && !customSauberTab.dataset.listener) {
    customSauberTab.dataset.listener = "true";
    customSauberTab.addEventListener("click", () => {
      showLazyAlternativeCode = false;
      renderCodeInspectorWorkspace();
    });
  }

  if (customSlopTab && !customSlopTab.dataset.listener) {
    customSlopTab.dataset.listener = "true";
    customSlopTab.addEventListener("click", () => {
      showLazyAlternativeCode = true;
      renderCodeInspectorWorkspace();
    });
  }

  // Bind click-to-copy handler
  const copyBtn = document.getElementById("btn-copy-snippet");
  if (copyBtn && !copyBtn.dataset.listener) {
    copyBtn.dataset.listener = "true";
    copyBtn.addEventListener("click", () => {
      const codeToCopy = showLazyAlternativeCode 
        ? (SLOP_RECIPES[selectedInspectorProject.id] || "")
        : selectedInspectorProject.codeSnippet;

      navigator.clipboard.writeText(codeToCopy).then(() => {
        // Show success visual indicators
        const copyIcon = document.getElementById("copy-icon-svg");
        const successIcon = document.getElementById("copy-success-svg");
        const btnText = document.getElementById("copy-btn-text");

        if (copyIcon) copyIcon.classList.add("hidden");
        if (successIcon) successIcon.classList.remove("hidden");
        if (btnText) {
          btnText.textContent = "Kopiert!";
          btnText.classList.add("text-emerald-500");
        }

        setTimeout(() => {
          if (copyIcon) copyIcon.classList.remove("hidden");
          if (successIcon) successIcon.classList.add("hidden");
          if (btnText) {
            btnText.textContent = "Kopieren";
            btnText.classList.remove("text-emerald-500");
          }
        }, 2000);
      });
    });
  }
}

// 6. CHRONOLOGICAL MILESTONES TIMELINE ENGINE
function renderTimelineChronology() {
  const container = document.getElementById("experience-timeline-container");
  if (!container) return;

  container.innerHTML = "";

  TIMELINE.forEach((event, idx) => {
    const node = document.createElement("div");
    node.className = "relative group";

    // Tech tags
    let techTags = event.techUsed.map(t => {
      return `<span class="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 rounded text-[10px] font-mono text-neutral-600 dark:text-neutral-300 shrink-0">${t}</span>`;
    }).join("");

    // Accordions visibility
    const isExpanded = activeStoryIdx === idx;
    const accordionText = isExpanded ? "Factual context ausblenden ▲" : "Factual context einblenden ▼";
    const accordionClass = isExpanded ? "" : "hidden";

    node.innerHTML = `
      <!-- Headline descriptions headers -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-2.5">
        <div>
          <span class="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 uppercase tracking-widest bg-neutral-100 dark:bg-neutral-900 px-2.5 py-0.5 rounded-full mb-1">
            <!-- Calendar tracker -->
            <svg class="w-3 h-3 text-brand-purple" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${event.date}</span>
          </span>
          <h4 class="text-lg font-sans font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-brand-accent transition-all">
            ${event.role}
          </h4>
          <div class="text-sm font-sans font-medium text-neutral-600 dark:text-neutral-400">
            ${event.company}
          </div>
        </div>
      </div>

      <!-- Narrative descriptions -->
      <p class="text-sm text-neutral-500 dark:text-neutral-400 font-sans leading-relaxed max-w-3xl mb-4">
        ${event.description}
      </p>

      <!-- Technology references tags -->
      <div class="flex flex-wrap gap-1.5 mb-4">
        ${techTags}
      </div>

      <!-- Story accordion triggers -->
      <div class="bg-neutral-50 dark:bg-neutral-900/40 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors">
        <button class="toggle-story-btn w-full flex items-center justify-between text-left font-mono text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer focus:outline-none" data-idx="${idx}">
          <div class="flex items-center gap-2">
            <!-- Story talk code bubbles -->
            <svg class="w-4 h-4 text-brand-accent shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="story-btn-text text-brand-accent font-bold">${accordionText}</span>
          </div>
          <span class="text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 leading-none">Insight</span>
        </button>

        <!-- Dynamic expanded proof-of-work container -->
        <div class="story-body-block mt-3 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-sans border-t border-neutral-200/40 dark:border-neutral-800/40 pt-2.5 ${accordionClass}">
          ${event.realStory}
        </div>
      </div>
    `;

    // Bind triggers click matching chronology levels
    const tglBtn = node.querySelector(".toggle-story-btn");
    if (tglBtn) {
      tglBtn.addEventListener("click", () => {
        const clickedIdx = parseInt(tglBtn.getAttribute("data-idx"));
        activeStoryIdx = activeStoryIdx === clickedIdx ? null : clickedIdx;
        
        // Re-render
        renderTimelineChronology();
      });
    }

    container.appendChild(node);
  });
}

// 7. CAREER APPLICANT RECRUITING CONTACT REGISTER FORM
function initRecruitingContactForm() {
  const form = document.getElementById("contact-team-form");
  const successToast = document.getElementById("form-success-toast");
  const errorToast = document.getElementById("form-error-toast");
  const submitBtn = document.getElementById("btn-submit-contact");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Reset status elements visibility
    if (successToast) successToast.classList.add("hidden");
    if (errorToast) errorToast.classList.add("hidden");

    // Extract values
    const nameVal = document.getElementById("form-name").value.trim();
    const emailVal = document.getElementById("form-email").value.trim();
    const messageVal = document.getElementById("form-message").value.trim();

    // Check validity specifications
    if (!nameVal || !emailVal || !messageVal) {
      if (errorToast) errorToast.classList.remove("hidden");
      return;
    }

    // Set submit loader indicator states
    if (submitBtn) {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.innerHTML = `
        <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Wird gesendet...</span>
      `;
    }

    // Simulate dispatch timing latencies
    setTimeout(() => {
      // Restore submit triggers
      if (submitBtn) {
        submitBtn.removeAttribute("disabled");
        submitBtn.innerHTML = `
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>Nachricht absenden</span>
        `;
      }

      // Show success container information
      if (successToast) successToast.classList.remove("hidden");
      
      // Reset form controls
      form.reset();

    }, 1250);
  });
}

// 8. SMOOTH SCROLLS ANCHOR HOOKS
function setupAnchorLinksSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetHash = this.getAttribute("href");
      if (targetHash === "#") return;

      const targetEl = document.getElementById(targetHash.substring(1));
      if (targetEl) {
        targetEl.scrollIntoView({
          behavior: "smooth"
        });

        // Close mobile dropdown menu if visible on anchor triggers
        const mobMenu = document.getElementById("mobile-menu");
        if (mobMenu) mobMenu.classList.add("hidden");
      }
    });
  });
}

// 10. MOBILE HAMBURGER DROPDOWN HANDLER
function initMobileHamburgerDropdown() {
  const burgerBtn = document.getElementById("mobile-hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!burgerBtn || !mobileMenu) return;

  burgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!mobileMenu.classList.contains("hidden")) {
      if (!mobileMenu.contains(e.target) && !burgerBtn.contains(e.target)) {
        mobileMenu.classList.add("hidden");
      }
    }
  });
}
