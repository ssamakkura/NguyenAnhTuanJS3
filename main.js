getall();
async function getall() {
    const API = 'https://api.escuelajs.co/api/v1/products';
    const table = document.getElementById('post-table');
    const tbody = document.getElementById('post-body');

    let products = [];
    try {
        const res = await fetch(API);
        products = await res.json();
    } catch (e) {
        console.error('Failed to fetch products', e);
        tbody.innerHTML = '<tr><td colspan="6">Failed to load products</td></tr>';
        return;
    }
    const fallbackSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180'>` +
        `<rect width='100%' height='100%' fill='%23f3f4f6'/>` +
        `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-family='Arial,Helvetica,sans-serif' font-size='14'>No image</text>` +
        `</svg>`;
    const fallbackDataUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(fallbackSvg);

    // state
    let state = {
        query: '',
        perPage: 5,
        page: 1,
        sortField: null, 
        sortDir: 1 
    };

    function ensureToolbar() {
        let toolbar = document.getElementById('products-toolbar');
        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'products-toolbar';
            toolbar.className = 'mb-4 flex flex-wrap items-center gap-3';
            table.parentNode.insertBefore(toolbar, table);
        }
        toolbar.innerHTML = `
            <input id="search_input" placeholder="Search by title..." class="px-3 py-2 border rounded flex-1" />
            <label class="flex items-center gap-2">Per page:
                <select id="per_page_select" class="px-2 py-1 border rounded">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
            </label>
            <div class="flex items-center gap-2">
                <button id="sort_name" class="px-3 py-1 bg-gray-200 rounded">Sort Name</button>
                <button id="sort_price" class="px-3 py-1 bg-gray-200 rounded">Sort Price</button>
            </div>
            <div id="pagination" class="ml-auto"></div>
        `;
        const search = document.getElementById('search_input');
        const perPage = document.getElementById('per_page_select');
        const sortName = document.getElementById('sort_name');
        const sortPrice = document.getElementById('sort_price');

        search.value = state.query;
        perPage.value = state.perPage.toString();

        search.oninput = (e) => {
            state.query = e.target.value.trim().toLowerCase();
            state.page = 1;
            render();
        };

        perPage.onchange = (e) => {
            state.perPage = parseInt(e.target.value, 10) || 5;
            state.page = 1;
            render();
        };

        sortName.onclick = () => {
            if (state.sortField === 'title') state.sortDir *= -1; else { state.sortField = 'title'; state.sortDir = 1; }
            render();
        };

        sortPrice.onclick = () => {
            if (state.sortField === 'price') state.sortDir *= -1; else { state.sortField = 'price'; state.sortDir = 1; }
            render();
        };
    }

    function renderPagination(totalItems) {
        const totalPages = Math.max(1, Math.ceil(totalItems / state.perPage));
        if (state.page > totalPages) state.page = totalPages;
        const pag = document.getElementById('pagination');
        if (!pag) return;
        let html = '';
        html += `<button id="prev_page" class="px-2 py-1 border rounded mr-2">Prev</button>`;
        const start = Math.max(1, state.page - 3);
        const end = Math.min(totalPages, start + 6);
        for (let p = start; p <= end; p++) {
            html += `<button data-page="${p}" class="px-2 py-1 mr-1 rounded ${p===state.page? 'bg-blue-500 text-white' : 'bg-gray-100'}">${p}</button>`;
        }
        html += `<button id="next_page" class="px-2 py-1 border rounded ml-2">Next</button>`;
        pag.innerHTML = html;

        const prev = document.getElementById('prev_page');
        const next = document.getElementById('next_page');
        prev.disabled = state.page <= 1;
        next.disabled = state.page >= totalPages;
        prev.onclick = () => { if (state.page>1) { state.page--; render(); } };
        next.onclick = () => { if (state.page<totalPages) { state.page++; render(); } };
        pag.querySelectorAll('button[data-page]').forEach(b => {
            b.onclick = () => { state.page = parseInt(b.dataset.page,10); render(); };
        });
    }

    function render() {
        // filter
        let filtered = products.filter(p => p.title && p.title.toLowerCase().includes(state.query));

        // sort
        if (state.sortField) {
            const f = state.sortField;
            filtered.sort((a,b) => {
                let va = f === 'price' ? (a.price||0) : (a.title||'').toLowerCase();
                let vb = f === 'price' ? (b.price||0) : (b.title||'').toLowerCase();
                if (va < vb) return -1 * state.sortDir;
                if (va > vb) return 1 * state.sortDir;
                return 0;
            });
        }

        const total = filtered.length;
        renderPagination(total);

        const start = (state.page - 1) * state.perPage;
        const end = start + state.perPage;
        const pageItems = filtered.slice(start, end);

        if (pageItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-2">No products</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        for (const p of pageItems) {
            const imageArray = Array.isArray(p.images) ? p.images.filter(img => img) : [];
            const category = p.category && p.category.name ? p.category.name : '';
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';

            // Track current image index per product
            const imageState = { currentIndex: 0 };

            // ID cell
            const tdId = document.createElement('td');
            tdId.className = 'px-4 py-2';
            tdId.textContent = p.id;

            // Image cell
            const tdImg = document.createElement('td');
            tdImg.className = 'px-4 py-2';
            const imgWrap = document.createElement('div');
            imgWrap.style.display = 'flex';
            imgWrap.style.alignItems = 'center';
            imgWrap.style.gap = '8px';

            // Left arrow button
            const btnPrev = document.createElement('button');
            btnPrev.textContent = '◄';
            btnPrev.style.padding = '4px 6px';
            btnPrev.style.fontSize = '12px';
            btnPrev.style.backgroundColor = '#d1d5db';
            btnPrev.style.border = '1px solid #999';
            btnPrev.style.borderRadius = '4px';
            btnPrev.style.cursor = imageArray.length > 1 ? 'pointer' : 'default';
            btnPrev.disabled = imageArray.length <= 1;

            // Image container
            const imgContainer = document.createElement('div');
            imgContainer.style.width = '120px';
            imgContainer.style.position = 'relative';

            const imgEl = document.createElement('img');
            imgEl.className = 'post-image';
            imgEl.alt = (p.title||'').replace(/"/g,'').replace(/'/g,'');
            imgEl.src = imageArray.length > 0 ? imageArray[0] : fallbackDataUrl;
            imgEl.onerror = function() { this.onerror = null; this.src = fallbackDataUrl; };
            imgContainer.appendChild(imgEl);

            // Image counter
            const counter = document.createElement('div');
            counter.style.position = 'absolute';
            counter.style.bottom = '4px';
            counter.style.right = '4px';
            counter.style.backgroundColor = 'rgba(0,0,0,0.6)';
            counter.style.color = 'white';
            counter.style.padding = '2px 4px';
            counter.style.borderRadius = '3px';
            counter.style.fontSize = '10px';
            counter.textContent = imageArray.length > 1 ? `${imageState.currentIndex + 1}/${imageArray.length}` : '';
            imgContainer.appendChild(counter);

            // Right arrow button
            const btnNext = document.createElement('button');
            btnNext.textContent = '►';
            btnNext.style.padding = '4px 6px';
            btnNext.style.fontSize = '12px';
            btnNext.style.backgroundColor = '#d1d5db';
            btnNext.style.border = '1px solid #999';
            btnNext.style.borderRadius = '4px';
            btnNext.style.cursor = imageArray.length > 1 ? 'pointer' : 'default';
            btnNext.disabled = imageArray.length <= 1;

            // Arrow click handlers
            btnPrev.onclick = () => {
                if (imageArray.length > 1) {
                    imageState.currentIndex = (imageState.currentIndex - 1 + imageArray.length) % imageArray.length;
                    imgEl.src = imageArray[imageState.currentIndex];
                    counter.textContent = `${imageState.currentIndex + 1}/${imageArray.length}`;
                }
            };

            btnNext.onclick = () => {
                if (imageArray.length > 1) {
                    imageState.currentIndex = (imageState.currentIndex + 1) % imageArray.length;
                    imgEl.src = imageArray[imageState.currentIndex];
                    counter.textContent = `${imageState.currentIndex + 1}/${imageArray.length}`;
                }
            };

            imgWrap.appendChild(btnPrev);
            imgWrap.appendChild(imgContainer);
            imgWrap.appendChild(btnNext);
            tdImg.appendChild(imgWrap);

            // Title cell
            const tdTitle = document.createElement('td');
            tdTitle.className = 'px-4 py-2';
            tdTitle.textContent = p.title || '';

            // Category cell
            const tdCat = document.createElement('td');
            tdCat.className = 'px-4 py-2';
            tdCat.textContent = category;

            // Price cell
            const tdPrice = document.createElement('td');
            tdPrice.className = 'px-4 py-2';
            tdPrice.textContent = p.price;

            // Actions placeholder
            const tdAct = document.createElement('td');
            tdAct.className = 'px-4 py-2';
            tdAct.innerHTML = '&nbsp;';

            row.appendChild(tdId);
            row.appendChild(tdImg);
            row.appendChild(tdTitle);
            row.appendChild(tdCat);
            row.appendChild(tdPrice);
            row.appendChild(tdAct);

            tbody.appendChild(row);
        }
    }

    ensureToolbar();
    render();
}
async function LoadData() {
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let body = document.getElementById('post-body')
        body.innerHTML = "";
        for (const post of posts) {
            body.innerHTML += convertDataToHTML(post);
        }
    } catch (error) {
        console.log(error);
    }

}
function convertDataToHTML(post) {
    let strikeStart = post.isDeleted ? '<s>' : '';
    let strikeEnd = post.isDeleted ? '</s>' : '';
    return `<tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2">${strikeStart}${post.id}${strikeEnd}</td>
        <td class="px-4 py-2">${strikeStart}${post.title}${strikeEnd}</td>
        <td class="px-4 py-2">${strikeStart}${post.views}${strikeEnd}</td>
        <td class="px-4 py-2 space-x-2">
            <input type='submit' value='delete' onclick='Delete(${post.id})' class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"/>
            <input type='submit' value='Add Comment' onclick='addComment(${post.id})' class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"/>
            <input type='submit' value='View Comments' onclick='viewComments(${post.id})' class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"/>
        </td>
    </tr>`
}
async function saveData() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let view = document.getElementById('views_txt').value;
    let resGET = await fetch('http://localhost:3000/posts/' + id)
    if (id && resGET.ok) {
        let existing = await resGET.json();
        let resPUT = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    ...existing,
                    title: title,
                    views: view
                })
        });
        if (resPUT.ok) {
            console.log("thanh cong");
            LoadData();
        }
        return false;
    } else {
        let resAll = await fetch('http://localhost:3000/posts');
        let posts = await resAll.json();
        let maxId = posts.length > 0 ? posts.reduce((max, post) => Math.max(max, parseInt(post.id)), 0) : 0;
        let newId = (maxId + 1).toString();
        let resPOST = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    id: newId,
                    title: title,
                    views: view
                })
        })
        if (resPOST.ok) {
            console.log("thanh cong");
            LoadData();
        }
        return false;
    }



}
async function Delete(id) {
    let resGET = await fetch('http://localhost:3000/posts/' + id);
    if (resGET.ok) {
        let existing = await resGET.json();
        let res = await fetch('http://localhost:3000/posts/' + id, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...existing,
                isDeleted: true
            })
        });
        if (res.ok) {
            console.log("soft delete thanh cong");
            LoadData();
        }
    }
}

async function addComment(postId) {
    let text = prompt("Enter comment text:");
    if (text) {
        let resAll = await fetch('http://localhost:3000/comments');
        let comments = await resAll.json();
        let maxId = comments.length > 0 ? comments.reduce((max, comment) => Math.max(max, parseInt(comment.id)), 0) : 0;
        let newId = (maxId + 1).toString();
        let resPOST = await fetch('http://localhost:3000/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: newId,
                text: text,
                postId: postId.toString()
            })
        });
        if (resPOST.ok) {
            console.log("comment added");
            viewComments(postId);
        }
    }
}

async function viewComments(postId) {
    let res = await fetch(`http://localhost:3000/comments?postId=${postId}`);
    let comments = await res.json();
    let display = document.getElementById('comments-display');
    if (comments.length > 0) {
        let html = `<h3 class="text-lg font-semibold mb-2">Comments for post ${postId}:</h3><ul class="space-y-2">`;
        comments.forEach(c => {
            let strikeStart = c.isDeleted ? '<s>' : '';
            let strikeEnd = c.isDeleted ? '</s>' : '';
            html += `<li class="flex justify-between items-center bg-gray-50 p-2 rounded">${strikeStart}${c.text}${strikeEnd} <button onclick='deleteComment("${c.id}", "${postId}")' class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button></li>`;
        });
        html += '</ul>';
        display.innerHTML = html;
    } else {
        display.innerHTML = `<p class="text-gray-500">No comments for this post.</p>`;
    }
}

async function deleteComment(commentId, postId) {
    let resGET = await fetch(`http://localhost:3000/comments/${commentId}`);
    if (resGET.ok) {
        let existing = await resGET.json();
        let res = await fetch(`http://localhost:3000/comments/${commentId}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...existing,
                isDeleted: true
            })
        });
        if (res.ok) {
            console.log("comment soft deleted");
            viewComments(postId);
        }
    }
}