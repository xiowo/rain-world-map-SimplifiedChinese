// tab切换
const tabList = document.querySelector('.nav');
const lis = tabList.querySelectorAll('li');
const items = document.querySelectorAll('.item');

const filteredLis = Array.from(lis).filter(li => !li.querySelector('a'));

filteredLis.forEach((li, i) => {
    li.dataset.index = i;

    li.addEventListener('click', () => {
        filteredLis.forEach(el => el.classList.remove('current'));
        li.classList.add('current');

        const index = parseInt(li.dataset.index, 10);

        if (isNaN(index) || index < 0 || index >= items.length) {
            console.error("Invalid index:", index);
            return;
        }

        items.forEach(item => item.style.display = 'none');
        items[index].style.display = 'block';
    });
});

// 默认选中第一个
if (filteredLis.length > 0) {
    filteredLis[0].click();
}



// 使用 Fetch API 获取 JSON 数据
fetch('/resources/icon-data.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('indexcontents');

        data.forEach(group => {
            if (group && group.subgroups) {
                // 创建组容器
                const groupDiv = document.createElement('div');
                groupDiv.className = 'indexgroup';

                // 创建组标题
                const h3 = document.createElement('h3');
                if (group.id) h3.id = group.id;
                h3.textContent = group.group;
                groupDiv.appendChild(h3);

                // 处理子组
                group.subgroups.forEach(subgroup => {
                    if (subgroup && subgroup.items) {
                        const subgroupDiv = document.createElement('div');
                        subgroupDiv.className = 'indexgroup';

                        // 子组标题
                        const h4 = document.createElement('h4');
                        if (subgroup.id) h4.id = subgroup.id;
                        h4.textContent = subgroup.subgroup || '';
                        subgroupDiv.appendChild(h4);

                        // 图标项
                        subgroup.items.forEach(item => {
                            if (item) {
                                const figure = document.createElement('figure');
                                figure.className = 'icon-figure';

                                // 图标图像
                                const img = document.createElement('img');
                                img.className = 'icon-img';
                                img.src = item.src;
                                img.alt = item.figcaption || '';
                                figure.appendChild(img);

                                // 标题
                                const figcaption = document.createElement('figcaption');
                                figcaption.className = 'icon-caption';
                                figcaption.textContent = item.figcaption || '';
                                figure.appendChild(figcaption);

                                // 内容（支持 HTML）
                                if (item.content) {
                                    const desc = document.createElement('p');
                                    desc.className = 'icon-desc';
                                    desc.innerHTML = item.content;
                                    figure.appendChild(desc);
                                }

                                // 表格数据
                                if (item.stats && Array.isArray(item.stats) && item.stats.length > 0) {
                                    const table = document.createElement('table');
                                    table.className = 'icon-stats';

                                    item.stats.forEach(stat => {
                                        const tr = document.createElement('tr');

                                        const tdLabel = document.createElement('td');
                                        tdLabel.textContent = stat.label;
                                        tr.appendChild(tdLabel);

                                        const tdValue = document.createElement('td');
                                        tdValue.textContent = stat.value;
                                        tr.appendChild(tdValue);

                                        table.appendChild(tr);
                                    });

                                    figure.appendChild(table);
                                }

                                subgroupDiv.appendChild(figure);
                            }
                        });

                        groupDiv.appendChild(subgroupDiv);
                    }
                });

                container.appendChild(groupDiv);
            }
        });
    })
    .catch(error => console.error('加载 JSON 数据时出错:', error));
