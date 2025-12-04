class Matrix {

    static trim(matrix) {
        // ищем габариты
        let minCol, minRow, maxCol, maxRow;
        matrix.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    minCol = Math.min(colIndex, isNaN(minCol) ? Infinity : minCol);
                    minRow = Math.min(rowIndex, isNaN(minRow) ? Infinity : minRow);
                    maxCol = Math.max(colIndex, isNaN(maxCol) ? -Infinity : maxCol);
                    maxRow = Math.max(rowIndex, isNaN(maxRow) ? -Infinity : maxRow);
                }
            });
        });

        // заполняем результирующую матрицу значениями из значимой области
        const result = Array(maxRow - minRow + 1).fill().map(() => Array(maxCol - minCol + 1));
        for (let i = minRow; i <= maxRow; i++) for (let j = minCol; j <= maxCol; j++) result[i - minRow][j - minCol] = matrix[i][j];

        return result;
    }

    static rotate(matrix, a) {
        function rotate90(matrix, direction = 1) {
            const rowCount = matrix.length;
            const colCount = matrix[0].length;
            const result = Array(colCount).fill().map(() => Array(rowCount));
            
            for (let i = 0; i < rowCount; i++) {
                for (let j = 0; j < colCount; j++) {
                    if (direction === 1) 
                        result[j][rowCount - 1 - i] = matrix[i][j]; // по часовой
                    else
                        result[colCount - 1 - j][i] = matrix[i][j]; // против
                }
            }
            return result;
        }
        
        const rotations = ((a % 4) + 4) % 4;
        
        if (rotations === 0) return matrix;                             // без изменений
        if (rotations === 1) return rotate90(matrix, 1);                // 90°
        if (rotations === 2) return rotate90(rotate90(matrix, 1), 1);   // 180°
        if (rotations === 3) return rotate90(matrix, -1);               // 270° = 90° против часовой
    }

    static flip(matrix) {
        return matrix.map(row => [...row].reverse());
    }

    static isEqual(matrix1, matrix2) {
        if (!Array.isArray(matrix1) || !Array.isArray(matrix2)) {
            return false;
        }
        
        if (!matrix1.every(row => Array.isArray(row)) || 
            !matrix2.every(row => Array.isArray(row))) {
            return false;
        }
        
        return matrix1.length === matrix2.length && 
            matrix1.every((row, i) => 
                row.length === matrix2[i].length && 
                row.every((element, j) => element === matrix2[i][j])
            );
    }

    static variations(matrix) {
        // берём исходную мартицу
        const result = [matrix.map(row => [...row])];

        // получаем все возможные варианты вращением
        for (let i = 1; i <= 3; i++) {
            const newMatrix = Matrix.rotate(matrix, i);
            if (!result.some((existing) => Matrix.isEqual(existing, newMatrix))) // добавляем только уникальные
                result.push(newMatrix);
        }

        // затем добавляем отражения
        const initialCount = result.length;
        for (let i = 0; i < initialCount; i++) {
            const newMatrix = Matrix.flip(result[i]);
            if (!result.some((existing) => Matrix.isEqual(existing, newMatrix))) // добавляем только уникальные
                result.push(newMatrix);
        }

        return result;
    }

    static isRelated(matrix1, matrix2) {
        return Matrix.variations(matrix1).some((matrix) => Matrix.isEqual(matrix, matrix2));
    }

}