// 使用 Fetch API 获取 JSON 数据
fetch('/resources/js/icon-data.json')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('indexcontents');

        data.forEach(group => {
            if (group && group.subgroups) {
                // 创建组容器
                const div = document.createElement('div');
                div.className = 'indexgroup';

                // 创建标题
                const h3 = document.createElement('h3');
                h3.id = group.id;
                h3.textContent = group.group;
                div.appendChild(h3);

                // 处理可能的子组
                group.subgroups.forEach(subgroup => {
                    if (subgroup && subgroup.items) {
                        const subDiv = document.createElement('div');
                        subDiv.className = 'indexgroup';

                        const h4 = document.createElement('h4');
                        h4.id = subgroup.id;
                        h4.textContent = subgroup.subgroup;
                        subDiv.appendChild(h4);

                        // 创建每个图标项
                        subgroup.items.forEach(item => {
                            if (item) {
                                const figure = document.createElement('figure');

                                const img = document.createElement('img');
                                img.src = item.src;
                                figure.appendChild(img);

                                const figcaption = document.createElement('figcaption');
                                figcaption.textContent = item.figcaption;
                                figure.appendChild(figcaption);

                                const content = document.createElement('content');
                                content.textContent = item.content;
                                figure.appendChild(content);

                                // 判断是否存在表格数据
                                if (item.stats && item.stats.length > 0) {
                                    const table = document.createElement('table');

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

                                subDiv.appendChild(figure);
                            }
                        });

                        div.appendChild(subDiv);
                    }
                });

                container.appendChild(div);
            }
        });
    })
    .catch(error => console.error('加载JSON数据时出错:', error));