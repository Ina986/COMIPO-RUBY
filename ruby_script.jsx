// 漫画写植用ルビ行間調整＆ルビ生成スクリプト
// 行間調整とルビテキストレイヤーの自動生成

#target photoshop

// 文字列のトリム関数（互換性のため）
function trimString(str) {
    if (!str) return "";
    return str.replace(/^\s+|\s+$/g, '');
}

// メイン処理
function main() {
    // ドキュメントが開いているかチェック
    if (app.documents.length === 0) {
        alert("ドキュメントを開いてください。");
        return;
    }

    var doc = app.activeDocument;

    // アクティブレイヤーがテキストレイヤーかチェック
    if (doc.activeLayer.kind !== LayerKind.TEXT) {
        alert("テキストレイヤーを選択してください。");
        return;
    }

    // ダイアログを表示
    showDialog(doc.activeLayer);
}

// UIダイアログ
function showDialog(textLayer) {
    var dialog = new Window("dialog", "ルビ用行間調整＆ルビ生成");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";

    // 説明テキスト
    dialog.add("statictext", undefined, "選択中のレイヤー: " + textLayer.name);

    // 現在の設定を取得
    var textItem = textLayer.textItem;
    var currentLeading = "自動";
    try {
        if (!textItem.useAutoLeading) {
            currentLeading = textItem.leading + " pt";
        } else {
            currentLeading = "自動 (" + textItem.autoLeadingAmount + "%")";
        }
    } catch (e) {}

    dialog.add("statictext", undefined, "現在の行間: " + currentLeading);

    // タブパネル
    var tabPanel = dialog.add("tabbedpanel");
    tabPanel.alignChildren = "fill";
    tabPanel.preferredSize.width = 400;

    // タブ1: 行間設定
    var leadingTab = tabPanel.add("tab", undefined, "行間設定");
    leadingTab.alignChildren = "fill";

    // 行間設定グループ
    var settingsGroup = leadingTab.add("panel", undefined, "行間設定");
    settingsGroup.orientation = "column";
    settingsGroup.alignChildren = "left";

    // 設定方法の選択
    var methodGroup = settingsGroup.add("group");
    var percentRadio = methodGroup.add("radiobutton", undefined, "パーセントで指定");
    var pointRadio = methodGroup.add("radiobutton", undefined, "ポイントで指定");
    percentRadio.value = true;

    // パーセント設定
    var percentGroup = settingsGroup.add("group");
    percentGroup.add("statictext", undefined, "行間:");
    var percentValue = percentGroup.add("edittext", undefined, "150");
    percentValue.characters = 5;
    percentGroup.add("statictext", undefined, "%");

    // ポイント設定
    var pointGroup = settingsGroup.add("group");
    pointGroup.add("statictext", undefined, "行間:");
    var pointValue = pointGroup.add("edittext", undefined, "18");
    pointValue.characters = 5;
    pointGroup.add("statictext", undefined, "pt");
    pointGroup.enabled = false;

    // ラジオボタンの切り替え
    percentRadio.onClick = function() {
        percentGroup.enabled = true;
        pointGroup.enabled = false;
    };

    pointRadio.onClick = function() {
        percentGroup.enabled = false;
        pointGroup.enabled = true;
    };

    // プリセットボタン
    var presetGroup = leadingTab.add("panel", undefined, "プリセット");
    presetGroup.orientation = "row";

    var preset125Button = presetGroup.add("button", undefined, "通常 (125%)");
    var preset150Button = presetGroup.add("button", undefined, "ルビ用 (150%)");
    var preset175Button = presetGroup.add("button", undefined, "ゆったり (175%)");

    preset125Button.onClick = function() {
        percentRadio.value = true;
        percentGroup.enabled = true;
        pointGroup.enabled = false;
        percentValue.text = "125";
    };

    preset150Button.onClick = function() {
        percentRadio.value = true;
        percentGroup.enabled = true;
        pointGroup.enabled = false;
        percentValue.text = "150";
    };

    preset175Button.onClick = function() {
        percentRadio.value = true;
        percentGroup.enabled = true;
        pointGroup.enabled = false;
        percentValue.text = "175";
    };

    // タブ2: ルビ生成
    var rubyTab = tabPanel.add("tab", undefined, "ルビ生成");
    rubyTab.alignChildren = "fill";

    // ルビ設定グループ
    var rubyGroup = rubyTab.add("panel", undefined, "ルビテキスト設定");
    rubyGroup.orientation = "column";
    rubyGroup.alignChildren = "fill";

    // ルビ入力
    rubyGroup.add("statictext", undefined, "ルビ文字を入力:");
    var rubyInput = rubyGroup.add("edittext", undefined, "");
    rubyInput.characters = 20;

    // ルビサイズ設定
    var rubySizeGroup = rubyGroup.add("group");
    rubySizeGroup.add("statictext", undefined, "ルビサイズ:");
    var rubySizeValue = rubySizeGroup.add("edittext", undefined, "50");
    rubySizeValue.characters = 5;
    rubySizeGroup.add("statictext", undefined, "% (親文字に対して)");

    // 位置調整
    var rubyPositionGroup = rubyGroup.add("panel", undefined, "位置調整");
    rubyPositionGroup.orientation = "column";
    rubyPositionGroup.alignChildren = "left";

    var offsetYGroup = rubyPositionGroup.add("group");
    offsetYGroup.add("statictext", undefined, "縦位置オフセット:");
    var offsetYValue = offsetYGroup.add("edittext", undefined, "0");
    offsetYValue.characters = 5;
    offsetYGroup.add("statictext", undefined, "px");

    var autoPositionCheck = rubyPositionGroup.add("checkbox", undefined, "親文字の上に自動配置");
    autoPositionCheck.value = true;

    // ルビスタイル設定
    var rubyStyleGroup = rubyTab.add("panel", undefined, "ルビスタイル");
    rubyStyleGroup.orientation = "column";
    rubyStyleGroup.alignChildren = "left";

    var inheritStyleCheck = rubyStyleGroup.add("checkbox", undefined, "親文字のスタイルを継承");
    inheritStyleCheck.value = true;

    var centerAlignCheck = rubyStyleGroup.add("checkbox", undefined, "中央揃え");
    centerAlignCheck.value = true;

    // ボタン
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var applyLeadingButton = buttonGroup.add("button", undefined, "行間を適用");
    var createRubyButton = buttonGroup.add("button", undefined, "ルビを生成");
    var bothButton = buttonGroup.add("button", undefined, "両方実行");
    var cancelButton = buttonGroup.add("button", undefined, "キャンセル");

    // 行間適用ボタン
    applyLeadingButton.onClick = function() {
        var usePercent = percentRadio.value;
        var value = usePercent ? parseFloat(percentValue.text) : parseFloat(pointValue.text);

        if (isNaN(value)) {
            alert("数値を入力してください。");
            return;
        }

        dialog.close();
        applyLeading(textLayer, value, usePercent);
    };

    // ルビ生成ボタン
    createRubyButton.onClick = function() {
        var rubyText = rubyInput.text;
        if (trimString(rubyText) === "") {
            alert("ルビ文字を入力してください。");
            return;
        }

        var rubySize = parseFloat(rubySizeValue.text);
        if (isNaN(rubySize)) {
            alert("ルビサイズは数値で入力してください。");
            return;
        }

        var offsetY = parseFloat(offsetYValue.text) || 0;

        dialog.close();
        createRubyLayer(textLayer, rubyText, rubySize,
                       inheritStyleCheck.value, centerAlignCheck.value,
                       autoPositionCheck.value, offsetY);
    };

    // 両方実行ボタン
    bothButton.onClick = function() {
        var usePercent = percentRadio.value;
        var value = usePercent ? parseFloat(percentValue.text) : parseFloat(pointValue.text);
        var rubyText = rubyInput.text;

        if (isNaN(value)) {
            alert("行間の数値を入力してください。");
            return;
        }

        if (trimString(rubyText) === "") {
            alert("ルビ文字を入力してください。");
            return;
        }

        var rubySize = parseFloat(rubySizeValue.text);
        if (isNaN(rubySize)) {
            alert("ルビサイズは数値で入力してください。");
            return;
        }

        var offsetY = parseFloat(offsetYValue.text) || 0;

        dialog.close();

        // 両方実行
        applyLeading(textLayer, value, usePercent);
        createRubyLayer(textLayer, rubyText, rubySize,
                       inheritStyleCheck.value, centerAlignCheck.value,
                       autoPositionCheck.value, offsetY);
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    dialog.show();
}

// 行間を適用
function applyLeading(textLayer, value, usePercent) {
    try {
        var doc = app.activeDocument;

        // 現在のアクティブレイヤーを保存
        var originalActiveLayer = doc.activeLayer;

        doc.activeLayer = textLayer;

        var textItem = textLayer.textItem;

        if (usePercent) {
            // パーセントで設定
            textItem.useAutoLeading = true;
            textItem.autoLeadingAmount = value;
        } else {
            // ポイントで設定
            textItem.useAutoLeading = false;
            textItem.leading = value;
        }

        // 元のアクティブレイヤーに戻す
        doc.activeLayer = originalActiveLayer;

        var unitText = usePercent ? "%" : "pt";
        // alert("行間を " + value + unitText + " に設定しました。");

    } catch (e) {
        alert("行間設定エラー: " + e.toString());
    }
}

// ルビレイヤーを作成
function createRubyLayer(parentLayer, rubyText, rubySizePercent, inheritStyle, centerAlign, autoPosition, offsetY) {
    try {
        var doc = app.activeDocument;

        // 現在のアクティブレイヤーを保存
        var originalActiveLayer = doc.activeLayer;

        // 親文字のスタイル情報を取得（読み取りのみ）
        var parentTextItem = parentLayer.textItem;
        var parentFont = parentTextItem.font;
        var parentSize = parentTextItem.size;
        if (parentSize.toString().indexOf("pt") > -1) {
            parentSize = parseFloat(parentSize);
        }
        var parentColor = parentTextItem.color;

        // ルビのサイズを計算
        var rubySize = parentSize * (rubySizePercent / 100);

        // 新しいテキストレイヤーを作成
        var rubyLayer = doc.artLayers.add();
        rubyLayer.kind = LayerKind.TEXT;
        // ルビのレイヤー名をルビ文字列と同一にする
        rubyLayer.name = rubyText;

        var rubyTextItem = rubyLayer.textItem;
        rubyTextItem.contents = rubyText;
        // ルビを縦書きで生成
        try {
            rubyTextItem.orientation = TextOrientation.VERTICAL;
        } catch (e) {}

        // スタイルを設定
        if (inheritStyle) {
            rubyTextItem.font = parentFont;
            rubyTextItem.color = parentColor;
        }
        rubyTextItem.size = rubySize;

        // テキストの配置
        if (centerAlign) {
            rubyTextItem.justification = Justification.CENTER;
        }

        // 位置を設定
        if (autoPosition) {
            positionRubyLayer(rubyLayer, parentLayer, offsetY);
        }

        // レイヤーの順序を調整（親レイヤーの上に配置）
        rubyLayer.move(parentLayer, ElementPlacement.PLACEBEFORE);

        // 元のアクティブレイヤーに戻す
        doc.activeLayer = originalActiveLayer;

        // alert("ルビレイヤー「" + rubyText + "」を作成しました。\nサイズ: " + rubySize.toFixed(1) + "pt");

    } catch (e) {
        alert("ルビ生成エラー: " + e.toString());
    }
}

// ルビレイヤーの位置を調整
function positionRubyLayer(rubyLayer, parentLayer, offsetY) {
    try {
        var doc = app.activeDocument;

        // 現在のアクティブレイヤーを保存
        var originalActiveLayer = doc.activeLayer;

        // 親レイヤーの境界を取得（アクティブにせずに取得）
        var parentBounds = getLayerBounds(parentLayer);

        // ルビレイヤーの境界を取得
        var rubyBounds = getLayerBounds(rubyLayer);

        // 親文字の中央X座標を計算
        var parentCenterX = (parentBounds[0] + parentBounds[2]) / 2;

        // ルビの中央X座標を計算
        var rubyCenterX = (rubyBounds[0] + rubyBounds[2]) / 2;

        // 移動量を計算
        var deltaX = parentCenterX - rubyCenterX;
        var deltaY = parentBounds[1] - rubyBounds[3] - 5 + offsetY; // 親文字の上に配置

        // ルビレイヤーを移動
        rubyLayer.translate(deltaX, deltaY);

        // 元のアクティブレイヤーに戻す
        doc.activeLayer = originalActiveLayer;

    } catch (e) {
        // 位置調整エラーの場合は無視（手動で調整してもらう）
    }
}

// レイヤーの境界を取得
function getLayerBounds(layer) {
    try {
        var bounds = layer.bounds;
        return [
            bounds[0].value,  // left
            bounds[1].value,  // top
            bounds[2].value,  // right
            bounds[3].value   // bottom
        ];
    } catch (e) {
        // エラーの場合はデフォルト値を返す
        return [0, 0, 100, 100];
    }
}

// 複数のルビを一括生成（拡張機能）
function createMultipleRuby(parentLayer, rubyTextArray, rubySizePercent) {
    for (var i = 0; i < rubyTextArray.length; i++) {
        if (trimString(rubyTextArray[i]) !== "") {
            createRubyLayer(parentLayer, rubyTextArray[i], rubySizePercent, true, true, true, i * -20);
        }
    }
}

// スクリプト実行
main();
