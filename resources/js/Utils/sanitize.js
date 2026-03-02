import DOMPurify from 'dompurify';

// Configuración: solo permite tags seguros de rich text
const ALLOWED_TAGS = [
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li',
    'blockquote', 'span', 'div'
];

const ALLOWED_ATTR = ['class', 'style'];

export function sanitizeHtml(dirty) {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        // Eliminar completamente tags peligrosos en lugar de dejarlos vacíos
        FORCE_BODY: true,
    });
}