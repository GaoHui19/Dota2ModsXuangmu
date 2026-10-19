// 🔑 云端同步 API 配置
const BIN_ID = '6ad5d3f1ffd5d1605377d5f8';
const MASTER_KEY = '$2a$10$H6/1k6xZrhDZrng0EcZVyOYg3ZOBe5YmYZnO2iYMiVkJA1qv8UmXi';

// 直接设定的管理员密码
const ADMIN_PWD = '3109557692G';

let isAdmin = false;
let currentCategory = 'all';
let resources = [];
let guideArticle = `
    <h4 class="text-amber-400 font-bold text-sm mb-2">📌 欢迎来到小猴子的百变MOD分发终端</h4>
    <p class="mb-2">本站所有 MOD 补丁均支持多端实时云端同步。请按照以下步骤正确安装：</p>
    <ol class="list-decimal list-inside space-y-1.5 text-gray-300">
        <li>通过上方分类或者搜索栏找到您心仪的 MOD 资源。</li>
        <li>点击卡片下方的<b>“一键下载”</b>按钮获取蓝奏云或网盘分发链接。</li>
        <li>将下载好的 MOD 文件放置到对应的游戏目录下（如 Dota 2 根目录的 <code>game/dota</code> 或对应 addons 文件夹）。</li>
        <li>如有疑问或需要定制 MOD，请联系管理员。</li>
    </ol>
`;

// 防 XSS 过滤
function sanitizeInput(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// 从云端拉取数据
async function fetchFromCloud() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        const data = await res.json();
        resources = data.record.resources || [];
        if (data.record.guide) {
            guideArticle = data.record.guide;
        }
        renderResources();
    } catch (err) {
        console.error("云端加载失败", err);
        resources = [];
        renderResources();
    }
}

// 同步保存至云端
async function syncToCloud() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ 
                resources: resources,
                guide: guideArticle 
            })
        });
        renderResources();
    } catch (err) {
        alert("云端同步失败，请检查网络或配置。");
    }
}

// 切换管理员模式
function toggleAdminMode() {
    if (!isAdmin) {
        let inputPwd = prompt("请输入管理员密码：");
        if (inputPwd !== null) {
            inputPwd = inputPwd.trim();
            
            if (inputPwd === ADMIN_PWD) {
                isAdmin = true;
                updateAdminUI();
                alert("✅ 管理员身份验证成功！");
            } else {
                alert("输入错误，请重试");
            }
        }
    } else {
        isAdmin = false;
        updateAdminUI();
        alert("已退出管理员模式。");
    }
}

// 更新管理员 UI 状态
function updateAdminUI() {
    const adminBtn = document.getElementById('adminBtn');
    const adminBtnText = document.getElementById('adminBtnText');
    const uploadBtn = document.getElementById('uploadTriggerBtn');
    const adminNoticeBar = document.getElementById('adminNoticeBar');
    const guideBtnText = document.getElementById('guideBtnText');

    if (isAdmin) {
        adminBtn.className = "px-3.5 py-2 rounded-xl text-xs font-semibold transition bg-amber-500/20 text-amber-400 border border-amber-500 flex items-center space-x-1.5 shadow-lg shadow-amber-500/10";
        adminBtnText.innerText = "退出管理员";
        uploadBtn.classList.remove('hidden');
        if (adminNoticeBar) adminNoticeBar.classList.remove('hidden');
        guideBtnText.innerText = "✏️ 编辑教程文章";
    } else {
        adminBtn.className = "px-3.5 py-2 rounded-xl text-xs font-semibold transition bg-gray-900/90 hover:bg-gray-800 text-gray-300 border border-gray-700/80 flex items-center space-x-1.5 shadow-lg";
        adminBtnText.innerText = "管理员模式";
        uploadBtn.classList.add('hidden');
        if (adminNoticeBar) adminNoticeBar.classList.add('hidden');
        guideBtnText.innerText = "📖 教你安装MOD";
    }
    renderResources();
}

// 教学按钮点击逻辑：普通状态下打开阅读弹窗，管理员状态下打开编辑弹窗
function handleGuideClick() {
    if (isAdmin) {
        document.getElementById('guideTextarea').value = guideArticle;
        document.getElementById('editGuideModal').classList.remove('hidden');
    } else {
        document.getElementById('guideContentDisplay').innerHTML = guideArticle;
        document.getElementById('guideModal').classList.remove('hidden');
    }
}

function closeGuideModal() { document.getElementById('guideModal').classList.add('hidden'); }
function closeEditGuideModal() { document.getElementById('editGuideModal').classList.add('hidden'); }

// 提交编辑后的教程文章
async function handleEditGuideSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('saveGuideBtn');
    btn.innerText = "同步保存中...";
    btn.disabled = true;

    guideArticle = document.getElementById('guideTextarea').value;
    await syncToCloud();

    btn.innerText = "保存并同步云端";
    btn.disabled = false;
    closeEditGuideModal();
    alert("🎉 教程文章已更新并实时同步至云端！");
}

function openUploadModal() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.add('hidden'); document.getElementById('uploadForm').reset(); }

// 分类筛选
function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.category-tab').forEach(tab => {
        if (tab.dataset.cat === cat) {
            tab.className = "category-tab px-3 py-1.5 rounded-xl text-xs font-bold transition bg-amber-500 text-black shadow-lg shadow-amber-500/20 shrink-0";
        } else {
            tab.className = "category-tab px-3 py-1.5 rounded-xl text-xs font-medium transition bg-gray-900/80 text-gray-300 hover:bg-gray-800 border border-gray-800 shrink-0";
        }
    });
    renderResources();
}

// 提交上传表单
async function handleUploadSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.innerText = "同步保存中...";
    btn.disabled = true;

    const title = sanitizeInput(document.getElementById('resTitle').value);
    const category = document.getElementById('resCategory').value;
    const desc = sanitizeInput(document.getElementById('resDesc').value);
    const link = sanitizeInput(document.getElementById('resLink').value);
    const imageFile = document.getElementById('resImage').files[0];

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            await addNewResource(title, category, desc, e.target.result, link);
            btn.innerText = "确认保存并同步云端";
            btn.disabled = false;
        };
        reader.readAsDataURL(imageFile);
    } else {
        const defaultImg = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80";
        await addNewResource(title, category, desc, defaultImg, link);
        btn.innerText = "确认保存并同步云端";
        btn.disabled = false;
    }
}

// 添加新资源
async function addNewResource(title, category, desc, image, link) {
    const newRes = { id: Date.now(), title, category, desc, image, link };
    resources.unshift(newRes);
    await syncToCloud();
    closeUploadModal();
    alert("🎉 资源添加成功并自动同步！");
}

// 删除资源
async function deleteResource(id) {
    if (confirm("确定要删除这个资源吗？")) {
        resources = resources.filter(item => item.id !== id);
        await syncToCloud();
    }
}

function filterResources() { renderResources(); }

// 分类名称映射
function getCategoryLabel(cat) {
    switch(cat) {
        case 'maps': return '地图';
        case 'weather': return '天气';
        case 'emblems': return '纹章';
        case 'effects': return '特效';
        case 'wards': return '眼位';
        case 'couriers': return '信使';
        case 'arcana': return '至宝';
        case 'personas': return '身心';
        default: return '资源';
    }
}

// 渲染列表逻辑
function renderResources() {
    const grid = document.getElementById('resourceGrid');
    const searchKeyword = sanitizeInput(document.getElementById('searchInput').value.toLowerCase());
    
    const filtered = resources.filter(item => {
        const matchesCat = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = item.title.toLowerCase().includes(searchKeyword) || item.desc.toLowerCase().includes(searchKeyword);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center space-y-2.5 glass-panel rounded-2xl border border-cyan-500/10">
                <div class="w-12 h-12 mx-auto rounded-xl bg-gray-900 border border-cyan-500/30 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/10 animate-pulse">✨</div>
                <div class="space-y-1">
                    <p class="text-xs font-black text-amber-400 tracking-widest uppercase">暂无资源，敬请期待</p>
                    <p class="text-[11px] text-gray-500">当前分类下暂未上架 MOD 补丁，猴哥正在整活中...</p>
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        let catLabel = getCategoryLabel(item.category);

        return `
            <div class="glass-card rounded-xl overflow-hidden flex flex-col justify-between group relative">
                <div>
                    <div class="relative h-24 sm:h-28 overflow-hidden bg-gray-950">
                        <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-65"></div>
                        <span class="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[9px] font-bold text-amber-400 border border-amber-500/30 shadow">${catLabel}</span>
                        ${isAdmin ? `
                            <button onclick="deleteResource(${item.id})" class="absolute top-1.5 right-1.5 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition shadow-lg" title="删除资源">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        ` : ''}
                    </div>
                    <div class="p-2 sm:p-2.5 space-y-1">
                        <h3 class="text-xs font-black text-white line-clamp-1 group-hover:text-amber-400 transition" title="${item.title}">${item.title}</h3>
                        <p class="text-[10px] sm:text-[11px] text-gray-400 line-clamp-2 leading-tight">${item.desc}</p>
                    </div>
                </div>
                <div class="p-2 sm:p-2.5 pt-0">
                    <a href="${item.link}" target="_blank" class="w-full py-1.5 bg-gray-900 hover:bg-amber-500 hover:text-black text-cyan-300 text-[11px] font-black rounded-lg transition text-center flex items-center justify-center space-x-1 border border-cyan-500/20 group-hover:border-amber-500 shadow-md">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="root" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        <span>一键下载</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// 页面加载完成后拉取云端数据
fetchFromCloud();
