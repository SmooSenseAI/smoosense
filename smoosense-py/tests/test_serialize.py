import unittest

from smoosense.my_logging import getLogger
from smoosense.utils.serialization import serialize

logger = getLogger(__name__)


class TestSerialize(unittest.TestCase):
    def test_nan(self):
        self.assertEqual(serialize(float("nan")), None)
        self.assertEqual(serialize([float("nan"), 1]), [None, 1])
        self.assertEqual(serialize({"a": float("nan")}), {"a": None})
        self.assertEqual(serialize([{"a": float("nan")}]), [{"a": None}])
        self.assertEqual(
            serialize(
                [
                    float("nan"),
                    None,
                ]
            ),
            [None, None],
        )

    def test_list_and_dict(self):
        self.assertEqual(serialize([]), [])
        self.assertEqual(serialize([1, 2, 3]), [1, 2, 3])
        self.assertEqual(serialize([3, 2, 1]), [3, 2, 1])
        self.assertEqual(serialize([{}]), [{}])
        self.assertEqual(serialize({"a": 1, "b": 2}), {"a": 1, "b": 2})
        self.assertEqual(serialize({"a": [1, 2], "b": (1, 2)}), {"a": [1, 2], "b": [1, 2]})

    def test_blob(self):
        self.assertIsNotNone(serialize(b"123"))

    def test_inf(self):
        self.assertEqual(serialize(float("inf")), None)
        self.assertEqual(serialize(float("-inf")), None)


if __name__ == "__main__":
    unittest.main()
