export interface Template {
    id: string;
    name: string;
    category: 'animals' | 'objects' | 'faces' | 'nature';
    // SVG path d attribute in a 0-200 coordinate space, center at (100,100)
    svgPath: string;
}

export const templates: Template[] = [
    {
        id: 'house',
        name: 'Ház',
        category: 'objects',
        svgPath: 'M 100 15 L 182 82 L 162 82 L 162 185 L 38 185 L 38 82 L 18 82 Z M 80 185 L 80 128 L 120 128 L 120 185 Z',
    },
    {
        id: 'star',
        name: 'Csillag',
        category: 'objects',
        svgPath: 'M 100 10 L 121 71 L 186 72 L 135 113 L 153 173 L 100 136 L 47 173 L 65 113 L 14 72 L 79 71 Z',
    },
    {
        id: 'heart',
        name: 'Szív',
        category: 'objects',
        svgPath: 'M 100 165 C 50 130 10 90 10 60 C 10 25 38 10 62 10 C 80 10 95 22 100 40 C 105 22 120 10 138 10 C 162 10 190 25 190 60 C 190 90 150 130 100 165 Z',
    },
    {
        id: 'cat',
        name: 'Macska',
        category: 'faces',
        svgPath: 'M 100 100 m -62 0 a 62 62 0 1 0 124 0 a 62 62 0 1 0 -124 0 M 28 72 L 14 18 L 64 55 Z M 172 72 L 186 18 L 136 55 Z M 82 100 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 M 118 100 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0 M 88 122 L 100 132 L 112 122',
    },
    {
        id: 'tree',
        name: 'Fa',
        category: 'nature',
        svgPath: 'M 100 10 L 178 132 L 130 132 L 130 188 L 70 188 L 70 132 L 22 132 Z',
    },
    {
        id: 'fish',
        name: 'Hal',
        category: 'animals',
        svgPath: 'M 32 100 C 32 55 62 18 100 18 C 145 18 168 58 168 100 C 168 142 145 182 100 182 C 62 182 32 145 32 100 Z M 168 100 L 195 72 L 195 128 Z M 112 92 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0',
    },
    {
        id: 'butterfly',
        name: 'Pillangó',
        category: 'animals',
        svgPath: 'M 100 100 C 78 68 12 22 10 72 C 8 118 72 148 100 100 Z M 100 100 C 122 68 188 22 190 72 C 192 118 128 148 100 100 Z M 100 38 C 96 68 96 132 100 162',
    },
    {
        id: 'flower',
        name: 'Virág',
        category: 'nature',
        svgPath: 'M 100 62 C 122 40 122 15 100 15 C 78 15 78 40 100 62 M 138 100 C 160 78 185 78 185 100 C 185 122 160 122 138 100 M 100 138 C 78 160 78 185 100 185 C 122 185 122 160 100 138 M 62 100 C 40 78 15 78 15 100 C 15 122 40 122 62 100 M 100 100 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0',
    },
    {
        id: 'sun',
        name: 'Nap',
        category: 'nature',
        svgPath: 'M 100 100 m -46 0 a 46 46 0 1 0 92 0 a 46 46 0 1 0 -92 0 M 100 6 L 100 30 M 100 170 L 100 194 M 6 100 L 30 100 M 170 100 L 194 100 M 33 33 L 50 50 M 150 150 L 167 167 M 167 33 L 150 50 M 50 150 L 33 167',
    },
    {
        id: 'moon',
        name: 'Hold',
        category: 'nature',
        svgPath: 'M 140 30 C 195 55 195 145 140 170 C 85 195 20 155 20 100 C 20 45 85 5 140 30 Z M 140 30 C 115 50 115 150 140 170',
    },
];
