(function() {
    const css = `
    /* Alternating row colors: odd rows black with white text, even rows white with black text */
    #post-table tbody tr:nth-child(odd) {
        background: #000;
        color: #fff;
    }
    #post-table tbody tr:nth-child(even) {
        background: #fff;
        color: #000;
    }
    /* Ensure images show entirely and don't crop */
    #post-table img, .post-image {
        max-width: 100%;
        width: 100%;
        height: auto;
        object-fit: contain;
        display: block;
    }
    /* Keep table borders visible when row is dark */
    #post-table td, #post-table th {
        border-color: rgba(255,255,255,0.12);
    }
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
})();
