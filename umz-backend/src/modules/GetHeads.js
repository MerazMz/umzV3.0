import * as cheerio from 'cheerio';

/**
 * Fetches Heads info from UMS
 * @param {import('axios').AxiosInstance} client - Authenticated Axios client
 * @returns {Promise<Array>} - Array of heads
 */
export async function fetchHeads(client) {
    try {
        const response = await client.post(
            'https://ums.lpu.in/lpuums/StudentDashboard.aspx/GetHeads',
            {},
            {
                headers: {
                    'Referer': 'https://ums.lpu.in/lpuums/StudentDashboard.aspx'
                }
            }
        );

        const html = response.data.d;
        if (!html) return [];
        
        import('fs').then(fs => fs.writeFileSync('scratch_heads.html', html));

        const $ = cheerio.load(html);
        const heads = [];

        const flatItems = [];
        
        function traverse(node) {
            if (node.type === 'text') {
                const text = $(node).text().trim();
                if (text && text !== 'Card image cap') {
                    flatItems.push({ type: 'text', value: text });
                }
            } else if (node.type === 'tag') {
                if (node.name === 'img') {
                    let src = $(node).attr('src') || '';
                    // Fix relative URLs if needed
                    if (src && src.startsWith('/')) {
                        src = 'https://ums.lpu.in' + src;
                    } else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                        src = 'https://ums.lpu.in/lpuums/' + src;
                    }
                    flatItems.push({ type: 'img', src: src });
                } else {
                    $(node).contents().each((i, child) => traverse(child));
                }
            }
        }
        
        // Traverse the entire parsed document
        $.root().contents().each((i, node) => traverse(node));
        
        // Chunk items by image
        const chunks = [];
        let currentChunk = null;
        
        for (const item of flatItems) {
            if (item.type === 'img') {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = {
                    image: item.src,
                    lines: []
                };
            } else if (item.type === 'text') {
                if (currentChunk) {
                    currentChunk.lines.push(item.value);
                } else {
                    // Create a generic chunk if text appears before any image
                    currentChunk = { image: '', lines: [item.value] };
                }
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        // Process chunks into structured objects
        for (const chunk of chunks) {
            const lines = chunk.lines;
            if (lines.length >= 2) {
                // Heuristics to clean up common UMS artifacts
                let contact = lines[4] || '';
                if (contact.includes('Book Appointment')) contact = lines[5] || contact;
                
                heads.push({
                    image: chunk.image,
                    type: lines[0] || 'Contact',
                    name: lines[1] || '',
                    role: lines[2] || '',
                    dept: lines[3] || '',
                    contact: contact,
                    raw: lines
                });
            }
        }

        // Fallback if parsing completely fails
        if (heads.length === 0) {
            return [{ rawHtml: html }];
        }

        return heads;
    } catch (error) {
        console.error('Error fetching heads:', error.message);
        return [];
    }
}
