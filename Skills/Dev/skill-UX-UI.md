### **Skills: Auditoría, Refactorización UX/UI y Desarrollo Robusto**

#### **1. Refactorización Visual y Ordenamiento de Estructuras Existentes**
*   **Auditoría Heurística (Basada en Nielsen):** Capacidad para evaluar el estado actual de la plataforma, identificando violaciones de usabilidad, inconsistencias y redundancias visuales generadas por desarrollos previos o automatizaciones.
*   **Erradicación de la "Div-itis" y el "Abuso de Cajas":** Detección y eliminación de contenedores innecesarios, bordes redundantes y estructuras anidadas que ensucian el código y la interfaz. Sustitución de cajas explícitas por separaciones implícitas usando el espacio negativo.
*   **Corrección del "Aspecto de IA" (Diseño Genérico):** Intervención en interfaces que parecen plantillas autogeneradas. Aportar identidad, jerarquía intencional y calidez humana que los modelos automatizados no logran estructurar por sí solos.

#### **2. Diseño de Interfaz (UI) Apoyado en Teorías Reconocidas**
*   **Aplicación de las Leyes de Gestalt:** Uso de los principios de *Proximidad* y *Similitud* para agrupar elementos visualmente sin necesidad de encerrarlos en cajas o usar líneas divisorias pesadas. El espacio en blanco define la estructura.
*   **Jerarquía Visual y Prevención de Fallos:** Manejo avanzado de tipografía, escalas, contraste y color para guiar el ojo del usuario. Se evitan malas prácticas como el bajo contraste (que destruye la accesibilidad) o la falta de *Affordance* (elementos que son clickeables pero no lo parecen, un fallo común en diseños generados por IA).
*   **Diseño Atómico (Atomic Design):** Ordenamiento del caos visual mediante la creación de un sistema de diseño estructurado desde lo más pequeño (átomos: botones, inputs) hasta lo más complejo (plantillas). Esto asegura que el diseño sea robusto y consistente en todas las pantallas.

#### **3. Arquitectura de la Información (IA) y Carga Cognitiva**
*   **Aplicación de la Ley de Hick:** Reducción del tiempo de decisión del usuario simplificando las opciones en pantalla. Estructuración lógica del contenido para evitar la sobrecarga cognitiva, un fallo típico cuando se "tira" toda la información en cajas sin priorizar.
*   **Modelado Mental y Taxonomía:** Organizar la navegación y el contenido para que coincida con cómo piensa el usuario humano, evitando las categorizaciones rígidas o antinaturales que suelen proponer los sistemas automatizados.
*   **Trazabilidad y Prevención de Callejones sin Salida:** Diseño de flujos robustos donde el usuario siempre sabe dónde está, cómo retroceder y cuáles son los siguientes pasos (Breadcrumbs, estados vacíos, manejo de errores).

#### **4. Prototipado, Wireframing e Interacción**
*   **Wireframing Funcional y Estructural:** Creación de maquetas en Figma/Adobe XD centradas en la funcionalidad y la distribución lógica antes de aplicar estilos, previniendo que los errores estructurales pasen a la fase de desarrollo.
*   **Ley de Fitts en la Interacción:** Dimensionamiento y posicionamiento estratégico de áreas interactivas (botones, enlaces) para minimizar el esfuerzo del usuario y evitar errores de clics accidentales, especialmente en entornos densos de información.
*   **Manejo de Estados Críticos:** Prototipado no solo del "camino feliz" (Happy Path), sino de lo que falla: diseño de estados de error, carga, éxito y *empty states*, asegurando que la aplicación sea robusta bajo cualquier circunstancia.

#### **5. Conocimientos Técnicos (HTML/CSS/JS) y Viabilidad**
*   **Dominio del Box Model, CSS Grid y Flexbox:** Conocimiento técnico estricto para exigir implementaciones modernas. Grid y Flexbox permiten alinear y distribuir elementos de forma compleja sin necesidad de crear múltiples `divs` envolventes (evitando el abuso de cajas).
*   **HTML Semántico y Accesibilidad (WCAG):** Entender que las etiquetas tienen propósito. Un diseño robusto se traduce en código estructurado (usando `<nav>`, `<article>`, `<section>`, `<aside>`) en lugar de contenedores genéricos, mejorando el rendimiento y la accesibilidad.
*   **Prevención de Deuda Técnica Visual:** Evitar diseños que dependan de scripts pesados en JS para animaciones o layouts que pueden resolverse de manera nativa y robusta con CSS puro.

#### **6. Empatía y Comunicación Técnica (Traducción a Equipos)**
*   **Comunicación Asertiva con Desarrollo:** Capacidad de documentar y transmitir ideas complejas mediante *Handoffs* detallados (especificaciones de tokens, espaciados exactos, comportamientos). No se dejan zonas grises a la interpretación que resulten en la adición de "cajas para resolver rápido".
*   **Empatía con el Usuario (User-Centric):** Ponerse en los zapatos del usuario final para asegurar que la interfaz resuelva sus problemas reales y no sea un simple escaparate técnico.
*   **Imposición de Criterio de Calidad:** Mantener líneas claras en la revisión del trabajo desarrollado. Capacidad para rechazar implementaciones que no respeten la jerarquía visual o que recurran a malas prácticas visuales, garantizando que el producto final funcione bien y sea verdaderamente robusto.