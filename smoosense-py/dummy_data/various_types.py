import os
import random
import string
from datetime import datetime, timedelta

import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

PWD = os.path.dirname(os.path.abspath(__file__))


class DummyDataGenerator:
    """A class to generate dummy data with various PyArrow types"""

    def __init__(self, n_rows=200, seed=42):
        """
        Initialize the dummy data generator

        Args:
            n_rows (int): Number of rows to generate
            seed (int): Random seed for reproducibility
        """
        self.n_rows = n_rows
        self.seed = seed
        self.output_dir = os.path.join(PWD, "../../data")
        self._set_random_seed()

    def _set_random_seed(self):
        """Set random seeds for reproducibility"""
        np.random.seed(self.seed)
        random.seed(self.seed)

    def _random_string(self, length=5):
        """Generate a random string of specified length"""
        return "".join(random.choices(string.ascii_letters + string.digits, k=length))

    def _generate_integer_array(self, pa_type):
        """Generate random integer array"""
        # Get min and max values for the integer type
        info = np.iinfo(pa_type.to_pandas_dtype())
        value_min = max(-1000, info.min)
        value_max = min(1000, info.max)
        values = np.random.randint(value_min, value_max, size=self.n_rows)
        return pa.array(values, type=pa_type)

    def _generate_float_array(self, pa_type):
        """Generate random float array"""
        return pa.array(np.random.rand(self.n_rows).astype(pa_type.to_pandas_dtype()), type=pa_type)

    def _generate_bool_array(self, with_nulls=False):
        """Generate random boolean array with nulls"""
        bool_options = [True, False]
        if with_nulls:
            bool_options.append(None)
        return pa.array(np.random.choice(bool_options, size=self.n_rows), type=pa.bool_())

    def _generate_string_array(self, with_nulls=False):
        """Generate random string array with various patterns"""
        string_options = [
            "a with space",
            "c having special characters: !@#$%^&*()",
            "",
            "emoji 🤣",
            "multiple\nlines\t\bstring",
        ]
        if with_nulls:
            string_options.append(None)
        return pa.array(np.random.choice(string_options, size=self.n_rows), type=pa.string())

    def _generate_datetime_array(self, with_nulls=False):
        """Generate random datetime array"""
        dates = [
            datetime(2023, 1, 1) + timedelta(days=int(d))
            for d in np.random.randint(0, 365, size=self.n_rows)
        ]
        if with_nulls:
            dates[np.random.randint(0, self.n_rows)] = None
        return pa.array(dates, type=pa.timestamp("ns"))

    def _generate_list_of_integers_array(self):
        """Generate random list array with variable-length lists"""
        lists = [
            list(np.random.randint(0, 100, size=np.random.randint(1, 5)).astype(int))
            if np.random.rand() > 0.1
            else None
            for _ in range(self.n_rows)
        ]
        return pa.array(lists, type=pa.list_(pa.int64()))

    def _generate_list_of_strings_array(self):
        lists = [
            [self._random_string(3), self._random_string(6), self._random_string(9)]
            if np.random.rand() > 0.1
            else None
            for _ in range(self.n_rows)
        ]
        return pa.array(lists, type=pa.list_(pa.string()))

    def _generate_blob_array(self):
        """Generate random binary blob array"""
        blobs = [
            bytes(np.random.randint(0, 256, size=np.random.randint(1, 10), dtype=np.uint8))
            if np.random.rand() > 0.05
            else None
            for _ in range(self.n_rows)
        ]
        return pa.array(blobs, type=pa.binary())

    def _generate_dict_array(self, with_nulls=False):
        """Generate random dictionary/map array"""
        dicts = [
            None
            if (np.random.rand() < 0.1 and with_nulls)
            else {self._random_string(3): int(np.random.randint(0, 100))}
            for _ in range(self.n_rows)
        ]
        return pa.array(dicts, type=pa.map_(pa.string(), pa.int64()))

    def _generate_struct_array(self, with_nulls=False):
        """Generate random struct array"""
        structs = [
            None
            if (np.random.rand() < 0.1 and with_nulls)
            else {"x": int(np.random.randint(0, 100)), "y": self._random_string(3)}
            for _ in range(self.n_rows)
        ]
        return pa.array(structs, type=pa.struct([("x", pa.int64()), ("y", pa.string())]))

    def generate_arrays(self):
        """Generate all arrays and return as a dictionary"""
        return {
            "idx_int": pa.array(range(self.n_rows), type=pa.int64()),
            "idx_str": pa.array([f"s{i}" for i in range(self.n_rows)], type=pa.string()),
            "url": pa.array(
                [f"https://placehold.co/{300 + i}x{400 - i}.png" for i in range(self.n_rows)],
                type=pa.string(),
            ),
            "pa_null": pa.array([None] * self.n_rows, type=pa.null()),
            "np_nan": pa.array([np.nan] * self.n_rows, type=pa.float64()),
            "np_inf": pa.array([np.inf] * self.n_rows, type=pa.float64()),
            "np_negative_inf": pa.array([-np.inf] * self.n_rows, type=pa.float64()),
            "np_int16": pa.array([np.int16(i) for i in range(self.n_rows)], type=pa.int16()),
            "one_value_string": pa.array(["single value"] * self.n_rows, type=pa.string()),
            "one_value_int": pa.array([1] * self.n_rows, type=pa.int64()),
            "one_value_float": pa.array([1.23456789] * self.n_rows, type=pa.float64()),
            "one_value_bool": pa.array([True] * self.n_rows, type=pa.bool_()),
            **{
                str(t): self._generate_integer_array(t)
                for t in [
                    pa.int8(),
                    pa.int16(),
                    pa.int32(),
                    pa.int64(),
                    pa.uint8(),
                    pa.uint16(),
                    pa.uint32(),
                    pa.uint64(),
                ]
            },
            **{
                str(t): self._generate_float_array(t)
                for t in [pa.float16(), pa.float32(), pa.float64()]
            },
            "bool": self._generate_bool_array(),
            "bool_with_nulls": self._generate_bool_array(with_nulls=True),
            "int_with_nulls": pa.array(
                np.random.choice([None, 1, 2, 3], size=self.n_rows), type=pa.int64()
            ),
            "string": self._generate_string_array(),
            "string_with_nulls": self._generate_string_array(with_nulls=True),
            "datetime": self._generate_datetime_array(),
            "datetime_with_nulls": self._generate_datetime_array(with_nulls=True),
            "list_of_integers": self._generate_list_of_integers_array(),
            "list_of_strings": self._generate_list_of_strings_array(),
            "blob": self._generate_blob_array(),
            "dict": self._generate_dict_array(),
            "dict_with_nulls": self._generate_dict_array(with_nulls=True),
            "struct": self._generate_struct_array(),
            "struct_with_nulls": self._generate_struct_array(with_nulls=True),
            "s3_url": pa.array(
                ["s3://sense-table-demo/datasets/COCO2017/images/000000000001.jpg"] * self.n_rows,
                type=pa.string(),
            ),
            "s3_alternative_url": pa.array(
                ["s3alternative://bucket/path/to/file.jpg"] * self.n_rows, type=pa.string()
            ),
        }

    def create_table(self):
        """Create PyArrow table from generated arrays"""
        arrays = self.generate_arrays()
        return pa.Table.from_arrays(list(arrays.values()), names=list(arrays.keys()))

    def ensure_output_directory(self):
        """Create output directory if it doesn't exist"""
        os.makedirs(self.output_dir, exist_ok=True)

    def save_files(self, filename="dummy_data_various_types"):
        """Save the generated data as a parquet file"""
        self.ensure_output_directory()
        table = self.create_table()
        parquet_path = os.path.join(self.output_dir, f"{filename}.parquet")
        pq.write_table(table, parquet_path)
        csv_path = os.path.join(self.output_dir, f"{filename}.csv")
        table.to_pandas().to_csv(csv_path, index=False)

    def get_schema(self):
        """Get the schema of the generated data"""
        return self.create_table().schema


if __name__ == "__main__":
    # Example usage
    generator = DummyDataGenerator(n_rows=200, seed=42)

    # Generate and save data
    generator.save_files()

    # Print schema
    print("\nSchema:")
    print(generator.get_schema())
