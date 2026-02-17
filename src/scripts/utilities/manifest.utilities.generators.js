// Utility generators
// Functions that generate CSS utilities from CSS variable suffixes

function createUtilityGenerators() {
    return {
        'color-': (suffix, value) => {
            const utilities = [];
            const addUtility = (prefix, property, baseValue) => {
                utilities.push([`${prefix}-${suffix}`, `${property}: ${baseValue}`]);
            };
            addUtility('text', 'color', value);
            addUtility('bg', 'background-color', value);
            addUtility('border', 'border-color', value);
            addUtility('outline', 'outline-color', value);
            addUtility('ring', 'box-shadow', `0 0 0 1px ${value}`);
            addUtility('fill', 'fill', value);
            addUtility('stroke', 'stroke', value);
            addUtility('decoration', 'text-decoration-color', value);
            addUtility('accent', 'accent-color', value);
            addUtility('caret', 'caret-color', value);
            return utilities;
        },
        'font-': (suffix, value) => [
            [`font-${suffix}`, `font-family: ${value}`]
        ],
        'text-': (suffix, value) => [
            [`text-${suffix}`, `font-size: ${value}`]
        ],
        'font-weight-': (suffix, value) => [
            [`font-${suffix}`, `font-weight: ${value}`]
        ],
        'tracking-': (suffix, value) => [
            [`tracking-${suffix}`, `letter-spacing: ${value}`]
        ],
        'leading-': (suffix, value) => [
            [`leading-${suffix}`, `line-height: ${value}`]
        ],
        'breakpoint-': (suffix, value) => [
            [`@${suffix}`, `@media (min-width: ${value})`]
        ],
        'container-': (suffix, value) => [
            [`container-${suffix}`, `max-width: ${value}`],
            [`@container-${suffix}`, `@container (min-width: ${value})`]
        ],
        'spacing-': (suffix, value) => [
            [`gap-${suffix}`, `gap: ${value}`],
            [`p-${suffix}`, `padding: ${value}`],
            [`px-${suffix}`, `padding-left: ${value}; padding-right: ${value}`],
            [`py-${suffix}`, `padding-top: ${value}; padding-bottom: ${value}`],
            [`m-${suffix}`, `margin: ${value}`],
            [`mx-${suffix}`, `margin-left: ${value}; margin-right: ${value}`],
            [`my-${suffix}`, `margin-top: ${value}; margin-bottom: ${value}`],
            [`space-x-${suffix}`, `> * + * { margin-left: ${value}; }`],
            [`space-y-${suffix}`, `> * + * { margin-top: ${value}; }`],
            [`max-w-${suffix}`, `max-width: ${value}`],
            [`max-h-${suffix}`, `max-height: ${value}`],
            [`min-w-${suffix}`, `min-width: ${value}`],
            [`min-h-${suffix}`, `min-height: ${value}`],
            [`w-${suffix}`, `width: ${value}`],
            [`h-${suffix}`, `height: ${value}`]
        ],
        'radius-': (suffix, value) => [
            [`rounded-${suffix}`, `border-radius: ${value}`]
        ],
        'shadow-': (suffix, value) => [
            [`shadow-${suffix}`, `box-shadow: ${value}`]
        ],
        'inset-shadow-': (suffix, value) => [
            [`inset-shadow-${suffix}`, `box-shadow: inset ${value}`]
        ],
        'drop-shadow-': (suffix, value) => [
            [`drop-shadow-${suffix}`, `filter: drop-shadow(${value})`]
        ],
        'blur-': (suffix, value) => [
            [`blur-${suffix}`, `filter: blur(${value})`]
        ],
        'perspective-': (suffix, value) => [
            [`perspective-${suffix}`, `perspective: ${value}`]
        ],
        'aspect-': (suffix, value) => [
            [`aspect-${suffix}`, `aspect-ratio: ${value}`]
        ],
        'ease-': (suffix, value) => [
            [`ease-${suffix}`, `transition-timing-function: ${value}`]
        ],
        'animate-': (suffix, value) => [
            [`animate-${suffix}`, `animation: ${value}`]
        ],
        'border-width-': (suffix, value) => [
            [`border-${suffix}`, `border-width: ${value}`]
        ],
        'border-style-': (suffix, value) => [
            [`border-${suffix}`, `border-style: ${value}`]
        ],
        'outline-': (suffix, value) => [
            [`outline-${suffix}`, `outline-color: ${value}`]
        ],
        'outline-width-': (suffix, value) => [
            [`outline-${suffix}`, `outline-width: ${value}`]
        ],
        'outline-style-': (suffix, value) => [
            [`outline-${suffix}`, `outline-style: ${value}`]
        ],
        'ring-': (suffix, value) => [
            [`ring-${suffix}`, `box-shadow: 0 0 0 ${value} var(--color-ring)`]
        ],
        'ring-offset-': (suffix, value) => [
            [`ring-offset-${suffix}`, `--tw-ring-offset-width: ${value}`]
        ],
        'divide-': (suffix, value) => [
            [`divide-${suffix}`, `border-color: ${value}`]
        ],
        'accent-': (suffix, value) => [
            [`accent-${suffix}`, `accent-color: ${value}`]
        ],
        'caret-': (suffix, value) => [
            [`caret-${suffix}`, `caret-color: ${value}`]
        ],
        'decoration-': (suffix, value) => [
            [`decoration-${suffix}`, `text-decoration-color: ${value}`]
        ],
        'placeholder-': (suffix, value) => [
            [`placeholder-${suffix}`, `&::placeholder { color: ${value} }`]
        ],
        'selection-': (suffix, value) => [
            [`selection-${suffix}`, `&::selection { background-color: ${value} }`]
        ],
        'scrollbar-': (suffix, value) => [
            [`scrollbar-${suffix}`, `scrollbar-color: ${value}`]
        ]
    };
}

